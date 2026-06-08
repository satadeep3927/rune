use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::State;

#[derive(serde::Serialize, Clone, Default)]
pub struct WindowContext {
    pub workspace: Option<String>,
    pub file_to_open: Option<String>,
}

pub struct WindowManager {
    pub windows: Mutex<HashMap<String, WindowContext>>,
    pub counter: Mutex<usize>,
}

pub fn resolve_workspace(path_str: &str) -> (String, Option<String>) {
    let mut p = PathBuf::from(path_str);
    if let Ok(canon) = std::fs::canonicalize(&p) {
        // canonicalize adds \\?\ prefix on windows
        let s = canon.to_string_lossy().to_string();
        if s.starts_with(r"\\?\") {
            p = PathBuf::from(&s[4..]);
        } else {
            p = canon;
        }
    }

    if p.is_file() {
        let parent = p.parent().unwrap_or(Path::new("")).to_string_lossy().to_string();
        (parent, Some(p.to_string_lossy().to_string()))
    } else {
        (p.to_string_lossy().to_string(), None)
    }
}

#[tauri::command]
pub fn get_window_context(window: tauri::Window, state: State<'_, WindowManager>) -> Result<WindowContext, String> {
    let mut mgr = state.windows.lock().unwrap();
    if let Some(ctx) = mgr.get_mut(window.label()) {
        let cloned = ctx.clone();
        ctx.file_to_open = None; // Consume the file so it doesn't reopen on refresh
        Ok(cloned)
    } else {
        Ok(WindowContext::default())
    }
}

#[tauri::command]
pub fn register_window_workspace(window: tauri::Window, workspace: String, state: State<'_, WindowManager>) {
    let mut p = PathBuf::from(&workspace);
    if let Ok(canon) = std::fs::canonicalize(&p) {
        let s = canon.to_string_lossy().to_string();
        if s.starts_with(r"\\?\") {
            p = PathBuf::from(&s[4..]);
        } else {
            p = canon;
        }
    }
    let normalized = p.to_string_lossy().to_string();

    let mut mgr = state.windows.lock().unwrap();
    if let Some(ctx) = mgr.get_mut(window.label()) {
        ctx.workspace = Some(normalized.clone());
    } else {
        mgr.insert(window.label().to_string(), WindowContext {
            workspace: Some(normalized),
            file_to_open: None,
        });
    }
}
