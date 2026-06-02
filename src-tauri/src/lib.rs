use std::sync::{Arc, Mutex};
use std::io::{Read, Write};
use std::collections::HashMap;
use tauri::{State, AppHandle, Emitter};
use portable_pty::{PtySystem, NativePtySystem, PtySize, CommandBuilder};

struct TerminalSession {
    writer: Box<dyn Write + Send>,
    _master: Box<dyn portable_pty::MasterPty + Send>,
    child: Arc<Mutex<Box<dyn portable_pty::Child + Send + Sync>>>,
}

struct TerminalState {
    sessions: Mutex<HashMap<String, TerminalSession>>,
}

#[derive(serde::Serialize, Clone)]
struct TerminalOutputPayload {
    id: String,
    data: String,
}

#[tauri::command]
fn start_terminal(app: AppHandle, state: State<'_, TerminalState>, term_id: String, cwd: Option<String>) -> Result<(), String> {
    let mut sessions = state.sessions.lock().unwrap();
    if sessions.contains_key(&term_id) {
        return Ok(());
    }

    let pty_system = NativePtySystem::default();
    let pair = pty_system.openpty(PtySize {
        rows: 24,
        cols: 80,
        pixel_width: 0,
        pixel_height: 0,
    }).map_err(|e| e.to_string())?;

    let mut cmd = CommandBuilder::new("powershell.exe");
    cmd.args(["-NoLogo"]);
    if let Some(path) = cwd {
        cmd.cwd(path);
    }

    let child = pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;
    let child_arc = Arc::new(Mutex::new(child));
    
    let master = pair.master;
    let reader = master.try_clone_reader().map_err(|e| e.to_string())?;
    let writer = master.take_writer().map_err(|e| e.to_string())?;
    
    sessions.insert(term_id.clone(), TerminalSession {
        writer,
        _master: master,
        child: child_arc.clone(),
    });

    // Spawn a thread to read output from PTY master
    let app_clone = app.clone();
    let thread_term_id = term_id.clone();
    std::thread::spawn(move || {
        let mut buffer = [0; 1024];
        let mut r = reader;
        loop {
            match r.read(&mut buffer) {
                Ok(0) => break, // EOF
                Ok(n) => {
                    let text = String::from_utf8_lossy(&buffer[..n]).to_string();
                    let payload = TerminalOutputPayload {
                        id: thread_term_id.clone(),
                        data: text,
                    };
                    let _ = app_clone.emit("terminal-output", payload);
                }
                Err(_) => break,
            }
        }
    });

    let app_clone2 = app;
    let thread_term_id2 = term_id.clone();
    std::thread::spawn(move || {
        loop {
            std::thread::sleep(std::time::Duration::from_millis(200));
            if let Ok(mut c) = child_arc.lock() {
                if let Ok(Some(_)) = c.try_wait() {
                    let _ = app_clone2.emit("terminal-exit", thread_term_id2);
                    break;
                }
            }
        }
    });

    Ok(())
}

#[tauri::command]
fn send_terminal_input(term_id: String, input: String, state: State<'_, TerminalState>) -> Result<(), String> {
    let mut sessions = state.sessions.lock().unwrap();
    if let Some(session) = sessions.get_mut(&term_id) {
        session.writer.write_all(input.as_bytes()).map_err(|e| e.to_string())?;
        session.writer.flush().map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Terminal not running".to_string())
    }
}

#[tauri::command]
fn kill_terminal(term_id: String, state: State<'_, TerminalState>) -> Result<(), String> {
    let mut sessions = state.sessions.lock().unwrap();
    if let Some(session) = sessions.remove(&term_id) {
        if let Ok(mut child) = session.child.lock() {
            let _ = child.kill();
        }
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Collect CLI args at startup – skip the first one (executable path)
    // and also skip Tauri-internal flags like "--tauri-*"
    let startup_path: Option<String> = std::env::args()
        .skip(1)
        .find(|a| !a.starts_with("--"));

    tauri::Builder::default()
        .manage(TerminalState { sessions: Mutex::new(HashMap::new()) })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![start_terminal, send_terminal_input, kill_terminal])
        .setup(move |app| {
            if let Some(path) = startup_path {
                let app_handle = app.handle().clone();
                // Delay slightly so the webview has time to mount and register its listener
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(300));
                    let _ = app_handle.emit("open-path", path);
                });
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
