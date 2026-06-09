use tauri::{AppHandle, State};
use std::path::Path;
use crate::indexer::{scan_workspace, Symbol, WorkspaceIndexer};

#[tauri::command]
pub fn index_workspace(workspace_path: String, state: State<'_, WorkspaceIndexer>, app: AppHandle) -> Result<(), String> {
    scan_workspace(workspace_path, state.state.clone(), app);
    Ok(())
}

#[tauri::command]
pub fn update_file_index(file_path: String, content: String, state: State<'_, WorkspaceIndexer>) -> Result<(), String> {
    if let Ok(mut indexer) = state.state.lock() {
        indexer.update_file(&file_path, &content);
    }
    Ok(())
}

#[tauri::command]
pub fn get_completions(query: String, state: State<'_, WorkspaceIndexer>) -> Result<Vec<String>, String> {
    if let Ok(indexer) = state.state.lock() {
        Ok(indexer.search(&query, 50)) // limit 50 completions
    } else {
        Ok(vec![])
    }
}

#[tauri::command]
pub fn get_workspace_symbols(query: String, workspace_path: Option<String>, state: State<'_, WorkspaceIndexer>) -> Result<Vec<Symbol>, String> {
    if let Ok(indexer) = state.state.lock() {
        Ok(indexer.get_workspace_symbols(&query, workspace_path.as_deref()))
    } else {
        Ok(vec![])
    }
}

#[tauri::command]
pub fn get_document_symbols(path: String, state: State<'_, WorkspaceIndexer>) -> Result<Vec<Symbol>, String> {
    if let Ok(indexer) = state.state.lock() {
        Ok(indexer.get_document_symbols(&path))
    } else {
        Ok(vec![])
    }
}

#[tauri::command]
pub fn get_definition(symbol: String, state: State<'_, WorkspaceIndexer>) -> Result<Option<Symbol>, String> {
    if let Ok(indexer) = state.state.lock() {
        Ok(indexer.get_definition(&symbol))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub fn get_indexed_files(workspace_path: Option<String>, state: State<'_, WorkspaceIndexer>) -> Result<Vec<String>, String> {
    if let Ok(indexer) = state.state.lock() {
        let ws = workspace_path.unwrap_or_default();
        let mut files: Vec<String> = indexer.file_words.keys()
            .filter(|p| ws.is_empty() || p.starts_with(&ws))
            .cloned()
            .collect();
        files.sort();
        Ok(files)
    } else {
        Ok(vec![])
    }
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchResult {
    pub file_path: String,
    pub file_name: String,
    pub line: usize,
    pub col: usize,
    pub text: String,
    pub match_start: usize,
    pub match_end: usize,
}

#[tauri::command]
pub async fn workspace_search(root_path: String, query: String) -> Result<Vec<SearchResult>, String> {
    use ignore::WalkBuilder;
    use std::fs::File;
    use std::io::{BufRead, BufReader, Read};

    let mut results = Vec::new();
    let q_lower = query.to_lowercase();
    let q_len = query.len();
    
    let walker = WalkBuilder::new(&root_path)
        .hidden(true)
        .git_ignore(true)
        .build();

    for result in walker {
        if results.len() >= 500 {
            break;
        }

        let entry = match result {
            Ok(e) => e,
            Err(_) => continue,
        };

        if !entry.file_type().map_or(false, |ft| ft.is_file()) {
            continue;
        }

        let path = entry.path();
        
        let file = match File::open(path) {
            Ok(f) => f,
            Err(_) => continue,
        };

        let mut reader = BufReader::new(file);
        
        // Peek to skip binaries
        let mut peek_buf = [0; 1024];
        if let Ok(n) = reader.read(&mut peek_buf) {
            if peek_buf[..n].contains(&0) {
                continue; // Likely binary
            }
        }
        
        // Re-open for line reading
        let file = match File::open(path) {
            Ok(f) => f,
            Err(_) => continue,
        };
        let reader = BufReader::new(file);

        let file_path = path.to_string_lossy().to_string();
        let file_name = path.file_name().unwrap_or_default().to_string_lossy().to_string();

        for (line_idx, line_res) in reader.lines().enumerate() {
            let line = match line_res {
                Ok(l) => l,
                Err(_) => break, // If we hit invalid UTF-8, stop reading
            };

            if let Some(byte_idx) = line.to_lowercase().find(&q_lower) {
                // byte_idx is byte index, frontend expects character index (col)
                let char_idx = line[..byte_idx].chars().count();
                let match_char_len = q_len; // simple approx for now
                
                results.push(SearchResult {
                    file_path: file_path.clone(),
                    file_name: file_name.clone(),
                    line: line_idx + 1,
                    col: char_idx + 1,
                    text: line,
                    match_start: char_idx,
                    match_end: char_idx + match_char_len,
                });

                if results.len() >= 500 {
                    break;
                }
            }
        }
    }

    Ok(results)
}

#[tauri::command]
pub fn fuzzy_search_files(query: String, workspace_path: Option<String>, state: State<'_, WorkspaceIndexer>) -> Result<Vec<String>, String> {
    if let Ok(indexer) = state.state.lock() {
        let mut results = Vec::new();
        let q = query.to_lowercase();
        let ws = workspace_path.unwrap_or_default();
        
        for file in indexer.file_words.keys() {
            if !ws.is_empty() && !file.starts_with(&ws) {
                continue;
            }
            let filename = Path::new(file).file_name().and_then(|n| n.to_str()).unwrap_or("").to_lowercase();
            let mut q_chars = q.chars().peekable();
            for c in filename.chars() {
                if let Some(&qc) = q_chars.peek() {
                    if c == qc {
                        q_chars.next();
                    }
                } else {
                    break;
                }
            }
            if q_chars.peek().is_none() {
                results.push(file.clone());
            }
        }
        
        results.truncate(60);
        Ok(results)
    } else {
        Ok(vec![])
    }
}
