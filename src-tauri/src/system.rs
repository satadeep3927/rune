#[derive(serde::Serialize)]
pub struct ExecResult {
    pub stdout: String,
    pub stderr: String,
    #[serde(rename = "exitCode")]
    pub exit_code: i32,
}

#[tauri::command]
pub fn execute_command(command: String, args: Vec<String>) -> Result<ExecResult, String> {
    let output = if cfg!(target_os = "windows") {
        let mut all_args = vec!["/C".to_string(), command.clone()];
        all_args.extend(args);
        std::process::Command::new("cmd")
            .args(&all_args)
            .output()
            .map_err(|e| format!("Failed to execute '{}': {}", command, e))?
    } else {
        std::process::Command::new(&command)
            .args(&args)
            .output()
            .map_err(|e| format!("Failed to execute '{}': {}", command, e))?
    };

    Ok(ExecResult {
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        exit_code: output.status.code().unwrap_or(-1),
    })
}

#[derive(serde::Serialize)]
pub struct StartupData {
    pub home_dir: String,
    pub global_settings: Option<String>,
    pub workspace_settings: Option<String>,
}

#[tauri::command]
pub fn load_startup(workspace_path: Option<String>) -> Result<StartupData, String> {
    let home = dirs::home_dir().ok_or("Cannot determine home directory")?;
    let home_str = home.to_string_lossy().to_string();

    let global_path = home.join(".rune").join("settings.json");
    let global_settings = if global_path.exists() {
        Some(std::fs::read_to_string(&global_path).map_err(|e| e.to_string())?)
    } else {
        None
    };

    let workspace_settings = if let Some(ref ws) = workspace_path {
        let ws_path = std::path::Path::new(ws).join(".rune").join("settings.json");
        if ws_path.exists() {
            Some(std::fs::read_to_string(&ws_path).map_err(|e| e.to_string())?)
        } else {
            None
        }
    } else {
        None
    };

    Ok(StartupData {
        home_dir: home_str,
        global_settings,
        workspace_settings,
    })
}
