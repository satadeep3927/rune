use std::path::{Path, PathBuf};
use clipboard_rs::{Clipboard, ClipboardContext};

#[tauri::command]
pub fn read_clipboard_files() -> Result<Vec<String>, String> {
    let ctx = ClipboardContext::new().map_err(|e| e.to_string())?;
    if ctx.has(clipboard_rs::ContentFormat::Files) {
        let files = ctx.get_files().map_err(|e| e.to_string())?;
        return Ok(files);
    }
    Ok(vec![])
}

#[tauri::command]
pub fn write_clipboard_files(paths: Vec<String>) -> Result<(), String> {
    let ctx = ClipboardContext::new().map_err(|e| e.to_string())?;
    ctx.set_files(paths).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn parse_markdown(text: String) -> String {
    use pulldown_cmark::{Parser, Options, html};
    let mut options = Options::empty();
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TASKLISTS);
    
    let parser = Parser::new_ext(&text, options);
    let mut html_output = String::new();
    html::push_html(&mut html_output, parser);
    html_output
}

pub fn copy_recursively(source: impl AsRef<Path>, destination: impl AsRef<Path>) -> std::io::Result<()> {
    std::fs::create_dir_all(&destination)?;
    for entry in std::fs::read_dir(source)? {
        let entry = entry?;
        let filetype = entry.file_type()?;
        if filetype.is_dir() {
            copy_recursively(entry.path(), destination.as_ref().join(entry.file_name()))?;
        } else {
            std::fs::copy(entry.path(), destination.as_ref().join(entry.file_name()))?;
        }
    }
    Ok(())
}

pub fn get_unique_dest(dest_dir: &str, src_path: &Path) -> PathBuf {
    let mut dest_path = PathBuf::from(dest_dir);
    if let Some(file_name) = src_path.file_name() {
        dest_path.push(file_name);
        let ext = src_path.extension().and_then(|e| e.to_str()).unwrap_or("");
        let stem = src_path.file_stem().and_then(|s| s.to_str()).unwrap_or("");
        let mut i = 1;
        while dest_path.exists() {
            let new_name = if ext.is_empty() {
                format!("{} ({})", stem, i)
            } else {
                format!("{} ({}).{}", stem, i, ext)
            };
            dest_path = PathBuf::from(dest_dir).join(new_name);
            i += 1;
        }
    }
    dest_path
}

#[tauri::command]
pub async fn batch_copy_files(paths: Vec<String>, dest_dir: String) -> Result<(), String> {
    let dest_canon = std::fs::canonicalize(Path::new(&dest_dir)).unwrap_or_else(|_| PathBuf::from(&dest_dir));
    for src in paths {
        let src_path = Path::new(&src);
        if let Ok(src_canon) = std::fs::canonicalize(&src_path) {
            if dest_canon.starts_with(&src_canon) {
                return Err("Cannot copy a folder into itself or its subdirectories.".to_string());
            }
        }
        let dest_path = get_unique_dest(&dest_dir, &src_path);
        if src_path.is_dir() {
            copy_recursively(&src_path, &dest_path).map_err(|e| e.to_string())?;
        } else {
            std::fs::copy(&src_path, &dest_path).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn batch_move_files(paths: Vec<String>, dest_dir: String) -> Result<(), String> {
    let dest_canon = std::fs::canonicalize(Path::new(&dest_dir)).unwrap_or_else(|_| PathBuf::from(&dest_dir));
    for src in paths {
        let src_path = Path::new(&src);
        if let Ok(src_canon) = std::fs::canonicalize(&src_path) {
            if dest_canon.starts_with(&src_canon) {
                return Err("Cannot move a folder into itself or its subdirectories.".to_string());
            }
        }
        let dest_path = get_unique_dest(&dest_dir, &src_path);
        std::fs::rename(&src_path, &dest_path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn delete_path_async(path: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        let p = std::path::Path::new(&path);
        if !p.exists() {
            return Ok(());
        }
        if p.is_dir() {
            std::fs::remove_dir_all(p).map_err(|e| e.to_string())
        } else {
            std::fs::remove_file(p).map_err(|e| e.to_string())
        }
    })
    .await
    .map_err(|e| format!("Task joined failed: {}", e))?
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileEntryNode {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
    pub is_expanded: bool,
    pub children: Option<Vec<FileEntryNode>>,
}

pub fn should_skip(name: &str, rel_path: &str, compiled_regexes: &[(String, Option<regex::Regex>)]) -> bool {
    let norm_rel = rel_path.replace("\\", "/");
    for (item, maybe_re) in compiled_regexes {
        if let Some(re) = maybe_re {
            if re.is_match(name) || re.is_match(&norm_rel) {
                return true;
            }
        } else {
            if name == item || norm_rel == *item || norm_rel.starts_with(&format!("{}/", item)) {
                return true;
            }
        }
    }
    false
}

#[tauri::command]
pub async fn get_expanded_tree(
    dir_path: String,
    root: String,
    expanded_paths: Vec<String>,
    excludes: Vec<String>
) -> Result<Vec<FileEntryNode>, String> {
    let mut compiled = Vec::new();
    for ex in &excludes {
        let clean = ex.trim().trim_end_matches('/').trim_start_matches('/').replace("\\", "/");
        if clean.contains('*') {
            let re_str = format!("^{}$", clean.replace(".", "\\.").replace("*", ".*"));
            let re = regex::Regex::new(&re_str).ok();
            compiled.push((clean, re));
        } else {
            compiled.push((clean, None));
        }
    }

    fn build_tree(dir: &Path, root: &str, expanded: &std::collections::HashSet<String>, compiled: &[(String, Option<regex::Regex>)]) -> Vec<FileEntryNode> {
        let mut nodes = Vec::new();
        if let Ok(entries) = std::fs::read_dir(dir) {
            for entry in entries.flatten() {
                let name = entry.file_name().to_string_lossy().to_string();
                let path_str = entry.path().to_string_lossy().to_string();
                
                let root_norm = root.replace("\\", "/").trim_end_matches('/').to_string();
                let path_norm = path_str.replace("\\", "/");
                let rel_path = if path_norm.starts_with(&root_norm) {
                    path_norm[root_norm.len()..].trim_start_matches('/').to_string()
                } else {
                    name.clone()
                };

                if should_skip(&name, &rel_path, compiled) {
                    continue;
                }

                let is_dir = entry.file_type().map(|ft| ft.is_dir()).unwrap_or(false);
                let is_expanded = expanded.contains(&path_str);
                
                let children = if is_dir && is_expanded {
                    Some(build_tree(&entry.path(), root, expanded, compiled))
                } else if is_dir {
                    Some(vec![])
                } else {
                    None
                };

                nodes.push(FileEntryNode {
                    name,
                    path: path_str,
                    is_directory: is_dir,
                    is_expanded,
                    children,
                });
            }
        }
        nodes.sort_by(|a, b| {
            if a.is_directory && !b.is_directory {
                std::cmp::Ordering::Less
            } else if !a.is_directory && b.is_directory {
                std::cmp::Ordering::Greater
            } else {
                a.name.cmp(&b.name)
            }
        });
        nodes
    }

    let expanded_set: std::collections::HashSet<String> = expanded_paths.into_iter().collect();
    Ok(build_tree(Path::new(&dir_path), &root, &expanded_set, &compiled))
}

#[tauri::command]
pub async fn read_filtered_dir(
    dir_path: String,
    root_path: Option<String>,
    excludes: Vec<String>
) -> Result<Vec<FileEntryNode>, String> {
    let root = root_path.unwrap_or_else(|| dir_path.clone());
    get_expanded_tree(dir_path, root, vec![], excludes).await
}
