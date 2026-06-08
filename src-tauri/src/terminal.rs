use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use std::io::{Read, Write};
use tauri::{AppHandle, Emitter, State};
use portable_pty::{CommandBuilder, NativePtySystem, PtySize, PtySystem};

pub struct TerminalSession {
    pub writer: Box<dyn Write + Send>,
    pub master: Box<dyn portable_pty::MasterPty + Send>,
    pub child: Arc<Mutex<Box<dyn portable_pty::Child + Send + Sync>>>,
}

pub struct TerminalState {
    pub sessions: Mutex<HashMap<String, TerminalSession>>,
}

#[derive(serde::Serialize, Clone)]
pub struct TerminalOutputPayload {
    pub id: String,
    pub data: String,
}

#[tauri::command]
pub fn start_terminal(
    app: AppHandle,
    state: State<'_, TerminalState>,
    term_id: String,
    cwd: Option<String>,
    rows: Option<u16>,
    cols: Option<u16>,
) -> Result<(), String> {
    let mut sessions = state.sessions.lock().unwrap();
    if sessions.contains_key(&term_id) {
        return Ok(());
    }

    let pty_system = NativePtySystem::default();
    let pair = pty_system.openpty(PtySize {
        rows: rows.unwrap_or(24),
        cols: cols.unwrap_or(80),
        pixel_width: 0,
        pixel_height: 0,
    }).map_err(|e| e.to_string())?;

    #[cfg(target_os = "windows")]
    let mut cmd = CommandBuilder::new("powershell.exe");
    #[cfg(target_os = "windows")]
    cmd.args(["-NoLogo"]);

    #[cfg(not(target_os = "windows"))]
    let mut cmd = CommandBuilder::new("bash");

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
        master,
        child: child_arc.clone(),
    });

    let app_clone = app.clone();
    let thread_term_id = term_id.clone();
    std::thread::spawn(move || {
        let mut buffer = [0; 4096];
        let mut r = reader;
        loop {
            match r.read(&mut buffer) {
                Ok(0) => break,
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
pub fn send_terminal_input(term_id: String, input: String, state: State<'_, TerminalState>) -> Result<(), String> {
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
pub fn resize_terminal(term_id: String, rows: u16, cols: u16, state: State<'_, TerminalState>) -> Result<(), String> {
    let mut sessions = state.sessions.lock().unwrap();
    if let Some(session) = sessions.get_mut(&term_id) {
        session.master.resize(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        }).map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("Terminal not running".to_string())
    }
}

#[tauri::command]
pub fn kill_terminal(term_id: String, state: State<'_, TerminalState>) -> Result<(), String> {
    let mut sessions = state.sessions.lock().unwrap();
    if let Some(session) = sessions.remove(&term_id) {
        if let Ok(mut child) = session.child.lock() {
            let _ = child.kill();
        }
    }
    Ok(())
}
