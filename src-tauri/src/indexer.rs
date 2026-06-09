use std::collections::{HashMap, HashSet};
use std::sync::{Arc, Mutex, OnceLock};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Emitter};
use regex::Regex;

#[derive(Debug, Clone, serde::Serialize)]
pub struct Symbol {
    pub name: String,
    pub kind: String,
    pub line: usize,
    pub path: String,
}

pub struct IndexerState {
    pub file_words: HashMap<String, HashSet<String>>,
    pub word_counts: HashMap<String, usize>,
    pub file_symbols: HashMap<String, Vec<Symbol>>,
}

fn symbol_regex() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| {
        Regex::new(r"(?m)^\s*(?:export\s+|pub\s+)?(?:async\s+)?(fn|function|class|struct|def|const)\s+([a-zA-Z_]\w*)").unwrap()
    })
}

impl IndexerState {
    pub fn new() -> Self {
        Self {
            file_words: HashMap::new(),
            word_counts: HashMap::new(),
            file_symbols: HashMap::new(),
        }
    }

    fn extract_words(content: &str) -> HashSet<String> {
        let mut words = HashSet::new();
        for word in content.split(|c: char| !c.is_alphanumeric() && c != '_') {
            if word.len() >= 3 && word.len() <= 100 {
                words.insert(word.to_string());
            }
        }
        words
    }

    fn extract_symbols(path: &str, content: &str) -> Vec<Symbol> {
        let mut symbols = Vec::new();
        let re = symbol_regex();
        
        let mut line_starts = vec![0];
        for (i, b) in content.bytes().enumerate() {
            if b == b'\n' {
                line_starts.push(i + 1);
            }
        }

        for caps in re.captures_iter(content) {
            if let (Some(kind_m), Some(name_m)) = (caps.get(1), caps.get(2)) {
                let name = name_m.as_str().to_string();
                let kind = kind_m.as_str().to_string();
                
                let offset = name_m.start();
                let line = match line_starts.binary_search(&offset) {
                    Ok(idx) => idx + 1,
                    Err(idx) => idx,
                };

                symbols.push(Symbol {
                    name,
                    kind,
                    line,
                    path: path.to_string(),
                });
            }
        }
        symbols
    }

    pub fn update_file(&mut self, path: &str, content: &str) {
        let new_words = Self::extract_words(content);
        let old_words = self.file_words.remove(path).unwrap_or_default();

        for w in &old_words {
            if !new_words.contains(w) {
                if let Some(count) = self.word_counts.get_mut(w) {
                    *count -= 1;
                    if *count == 0 {
                        self.word_counts.remove(w);
                    }
                }
            }
        }

        for w in &new_words {
            if !old_words.contains(w) {
                *self.word_counts.entry(w.clone()).or_insert(0) += 1;
            }
        }

        self.file_words.insert(path.to_string(), new_words);
        self.file_symbols.insert(path.to_string(), Self::extract_symbols(path, content));
    }

    pub fn search(&self, query: &str, limit: usize) -> Vec<String> {
        let mut results = Vec::new();
        for word in self.word_counts.keys() {
            if word.starts_with(query) && word != query {
                results.push(word.clone());
                if results.len() >= limit {
                    break;
                }
            }
        }
        results.sort();
        results
    }

    pub fn get_workspace_symbols(&self, query: &str, workspace_path: Option<&str>) -> Vec<Symbol> {
        let mut results = Vec::new();
        let q = query.to_lowercase();
        let ws = workspace_path.unwrap_or("");
        for (path, symbols) in &self.file_symbols {
            if !ws.is_empty() && !path.starts_with(ws) {
                continue;
            }
            for sym in symbols {
                if q.is_empty() || sym.name.to_lowercase().contains(&q) {
                    results.push(sym.clone());
                    if results.len() >= 100 {
                        return results;
                    }
                }
            }
        }
        results
    }

    pub fn get_document_symbols(&self, path: &str) -> Vec<Symbol> {
        if let Some(symbols) = self.file_symbols.get(path) {
            return symbols.clone();
        }
        Vec::new()
    }

    pub fn get_definition(&self, symbol_name: &str) -> Option<Symbol> {
        for symbols in self.file_symbols.values() {
            for sym in symbols {
                if sym.name == symbol_name {
                    return Some(sym.clone());
                }
            }
        }
        None
    }
}

pub struct WorkspaceIndexer {
    pub state: Arc<Mutex<IndexerState>>,
}

impl WorkspaceIndexer {
    pub fn new() -> Self {
        Self {
            state: Arc::new(Mutex::new(IndexerState::new())),
        }
    }
}

fn should_ignore(path: &Path) -> bool {
    let name = path.file_name().unwrap_or_default().to_string_lossy();
    
    // Ignore common build directories and hidden folders
    if name == "node_modules" || name == ".git" || name == "target" || name.starts_with('.') || name == "dist" || name == "build" || name == "__pycache__" || name == "vendor" {
        return true;
    }
    
    // Ignore common binary extensions and lock files
    let ext = path.extension().unwrap_or_default().to_string_lossy().to_lowercase();
    matches!(
        ext.as_str(),
        "png" | "jpg" | "jpeg" | "gif" | "ico" | "svg" | "webp" | 
        "exe" | "dll" | "so" | "dylib" | "wasm" | "bin" | "class" | 
        "zip" | "tar" | "gz" | "7z" | "rar" | 
        "mp4" | "mp3" | "wav" | "ogg" | "pdf" | "lock"
    )
}

pub fn scan_workspace(workspace_path: String, indexer: Arc<Mutex<IndexerState>>, app: AppHandle) {
    std::thread::spawn(move || {
        let _ = app.emit("indexing-progress", "Scanning...");
        
        let mut dirs_to_visit = vec![PathBuf::from(&workspace_path)];
        let mut files_to_read = Vec::new();

        let workspace_canon = match std::fs::canonicalize(&workspace_path) {
            Ok(c) => c,
            Err(_) => PathBuf::from(&workspace_path),
        };

        while let Some(dir) = dirs_to_visit.pop() {
            if let Ok(entries) = fs::read_dir(&dir) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    
                    // Do not follow symlinks to prevent indexing outside workspace
                    if let Ok(metadata) = path.symlink_metadata() {
                        if metadata.is_symlink() {
                            continue;
                        }
                    }

                    if should_ignore(&path) {
                        continue;
                    }
                    
                    if path.is_dir() {
                        // Ensure the path is within the workspace to prevent escaping via NTFS junctions
                        if let Ok(canon) = std::fs::canonicalize(&path) {
                            if canon.starts_with(&workspace_canon) {
                                dirs_to_visit.push(path);
                            }
                        }
                    } else if path.is_file() {
                        // Just push all non-ignored files
                        if let Ok(metadata) = path.metadata() {
                            if metadata.len() < 2_000_000 { // skip files > 2MB
                                files_to_read.push(path);
                            }
                        }
                    }
                }
            }
        }

        let total = files_to_read.len();
        for (i, path) in files_to_read.into_iter().enumerate() {
            if i % 10 == 0 {
                let _ = app.emit("indexing-progress", format!("Indexing {}/{}", i, total));
            }
            if let Ok(content) = fs::read_to_string(&path) {
                let path_str = path.to_string_lossy().to_string();
                if let Ok(mut state) = indexer.lock() {
                    state.update_file(&path_str, &content);
                }
            }
        }

        let _ = app.emit("indexing-done", format!("Indexed {} files", total));
    });
}
