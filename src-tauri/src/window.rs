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

use tauri::{AppHandle, Manager, Emitter};

pub fn handle_single_instance(app: &AppHandle, argv: Vec<String>, cwd: String) {
    let target_path = argv.iter().skip(1).find(|a| !a.starts_with("--"));
    if let Some(path_str) = target_path {
        let absolute_path = Path::new(&cwd).join(path_str);
        let path_str_abs = absolute_path.to_string_lossy().to_string();
        let (workspace, file) = resolve_workspace(&path_str_abs);
        
        let mgr = app.state::<WindowManager>();
        let mut windows = mgr.windows.lock().unwrap();
        
        let mut found_label = None;
        for (label, ctx) in windows.iter() {
            if let Some(ws) = &ctx.workspace {
                if app.get_webview_window(label).is_some() {
                    let target = Path::new(&path_str_abs);
                    let ws_path = Path::new(ws);
                    
                    let target_canon = std::fs::canonicalize(target).unwrap_or_else(|_| target.to_path_buf());
                    let target_s = target_canon.to_string_lossy().to_string();
                    let target_clean = if target_s.starts_with(r"\\?\") { &target_s[4..] } else { &target_s };
                    
                    if Path::new(target_clean).starts_with(ws_path) {
                        found_label = Some(label.clone());
                        break;
                    }
                }
            }
        }
        
        if let Some(label) = found_label {
            if let Some(win) = app.get_webview_window(&label) {
                let _ = win.unminimize();
                let _ = win.show();
                let _ = win.set_focus();
                if let Some(f) = file {
                    let _ = win.emit("open-path", f);
                }
            }
        } else {
            let mut counter = mgr.counter.lock().unwrap();
            *counter += 1;
            let label = format!("rune-window-{}", counter);
            
            windows.insert(label.clone(), WindowContext {
                workspace: Some(workspace),
                file_to_open: file,
            });
            
            let _ = tauri::WebviewWindowBuilder::new(app, &label, tauri::WebviewUrl::App("index.html".into()))
                .title("Rune")
                .inner_size(1280.0, 800.0)
                .min_inner_size(800.0, 500.0)
                .decorations(false)
                .build();
        }
    } else {
        if let Some(win) = app.get_webview_window("main") {
            let _ = win.unminimize();
            let _ = win.show();
            let _ = win.set_focus();
        }
    }
}
