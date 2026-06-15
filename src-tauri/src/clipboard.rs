use clipboard_rs::{Clipboard, ClipboardContext, ContentFormat};

#[tauri::command]
pub fn read_clipboard_text() -> Result<String, String> {
    let ctx = ClipboardContext::new().map_err(|e| e.to_string())?;
    ctx.get_text().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn write_clipboard_text(text: String) -> Result<(), String> {
    let ctx = ClipboardContext::new().map_err(|e| e.to_string())?;
    ctx.set_text(text).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn clipboard_has_text() -> Result<bool, String> {
    let ctx = ClipboardContext::new().map_err(|e| e.to_string())?;
    Ok(ctx.has(ContentFormat::Text))
}
