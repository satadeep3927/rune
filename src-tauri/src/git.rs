use serde::Serialize;
use std::process::Command;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

fn git_command() -> Command {
    let mut cmd = Command::new("git");
    #[cfg(target_os = "windows")]
    {
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }
    cmd
}

#[derive(Serialize)]
pub struct GitState {
    pub branch: Option<String>,
    pub status: Vec<GitFileStatus>,
}

#[derive(Serialize)]
pub struct GitFileStatus {
    pub file: String,
    pub status: String,
}

fn execute_git(args: &[&str], cwd: &str) -> Option<String> {
    let output = git_command()
        .args(args)
        .current_dir(cwd)
        .output()
        .ok()?;
    
    if output.status.success() {
        Some(String::from_utf8_lossy(&output.stdout).into_owned())
    } else {
        None
    }
}

#[tauri::command]
pub fn get_git_state(path: String) -> Option<GitState> {
    // 1. Check if git repository exists
    let is_repo = execute_git(&["rev-parse", "--is-inside-work-tree"], &path).map(|s| s.trim().to_string());
    if is_repo != Some("true".to_string()) {
        return None;
    }

    // 2. Get current branch
    let branch = execute_git(&["branch", "--show-current"], &path).map(|b| b.trim().to_string());

    // 3. Get status --porcelain
    let mut status_list = Vec::new();
    if let Some(status_out) = execute_git(&["status", "--porcelain"], &path) {
        for line in status_out.lines() {
            if line.len() > 3 {
                let status_code = &line[0..2];
                let file_path = &line[3..];
                status_list.push(GitFileStatus {
                    file: file_path.to_string(),
                    status: status_code.to_string(),
                });
            }
        }
    }

    Some(GitState {
        branch,
        status: status_list,
    })
}

#[tauri::command]
pub async fn git_commit(path: String, message: String) -> Result<String, String> {
    let output = git_command()
        .args(["commit", "-m", &message])
        .current_dir(&path)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        let mut err_msg = String::from_utf8_lossy(&output.stderr).to_string();
        if err_msg.is_empty() {
            err_msg = String::from_utf8_lossy(&output.stdout).to_string();
        }
        Err(err_msg)
    }
}

#[tauri::command]
pub fn git_add(path: String, files: Vec<String>) -> Result<String, String> {
    let mut cmd = git_command();
    cmd.arg("add");
    for file in files {
        cmd.arg(&file);
    }
    
    let output = cmd
        .current_dir(&path)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        let mut err_msg = String::from_utf8_lossy(&output.stderr).to_string();
        if err_msg.is_empty() {
            err_msg = String::from_utf8_lossy(&output.stdout).to_string();
        }
        Err(err_msg)
    }
}

#[tauri::command]
pub fn git_reset(path: String, files: Vec<String>) -> Result<String, String> {
    let mut cmd = git_command();
    cmd.arg("reset");
    cmd.arg("HEAD");
    for file in files {
        cmd.arg(&file);
    }
    
    let output = cmd
        .current_dir(&path)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        let mut err_msg = String::from_utf8_lossy(&output.stderr).to_string();
        if err_msg.is_empty() {
            err_msg = String::from_utf8_lossy(&output.stdout).to_string();
        }
        Err(err_msg)
    }
}

#[tauri::command]
pub async fn git_push(path: String) -> Result<String, String> {
    let output = git_command()
        .args(["push", "-u", "origin", "HEAD"])
        .current_dir(&path)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        let mut err_msg = String::from_utf8_lossy(&output.stderr).to_string();
        if err_msg.is_empty() {
            err_msg = String::from_utf8_lossy(&output.stdout).to_string();
        }
        Err(err_msg)
    }
}

#[tauri::command]
pub async fn git_pull(path: String) -> Result<String, String> {
    let output = git_command()
        .args(["pull", "origin", "HEAD"])
        .current_dir(&path)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        let mut err_msg = String::from_utf8_lossy(&output.stderr).to_string();
        if err_msg.is_empty() {
            err_msg = String::from_utf8_lossy(&output.stdout).to_string();
        }
        Err(err_msg)
    }
}

#[tauri::command]
pub fn git_init(path: String) -> Result<String, String> {
    let output = git_command()
        .args(["init"])
        .current_dir(&path)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
pub fn git_discard(path: String, files: Vec<String>) -> Result<String, String> {
    let mut cmd = git_command();
    cmd.arg("checkout");
    cmd.arg("--");
    for file in files {
        cmd.arg(&file);
    }
    
    let output = cmd
        .current_dir(&path)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        let mut err_msg = String::from_utf8_lossy(&output.stderr).to_string();
        if err_msg.is_empty() {
            err_msg = String::from_utf8_lossy(&output.stdout).to_string();
        }
        Err(err_msg)
    }
}

#[tauri::command]
pub fn git_list_branches(path: String) -> Result<Vec<String>, String> {
    let output = execute_git(&["branch", "--format=%(refname:short)"], &path)
        .ok_or("Failed to list branches")?;
    Ok(output.lines().map(|s| s.trim().to_string()).filter(|s| !s.is_empty()).collect())
}

#[tauri::command]
pub fn git_checkout(path: String, branch: String) -> Result<String, String> {
    let output = git_command()
        .args(["checkout", &branch])
        .current_dir(&path)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        let mut err_msg = String::from_utf8_lossy(&output.stderr).to_string();
        if err_msg.is_empty() {
            err_msg = String::from_utf8_lossy(&output.stdout).to_string();
        }
        Err(err_msg)
    }
}

#[tauri::command]
pub fn git_create_branch(path: String, branch: String) -> Result<String, String> {
    let output = git_command()
        .args(["checkout", "-b", &branch])
        .current_dir(&path)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        let mut err_msg = String::from_utf8_lossy(&output.stderr).to_string();
        if err_msg.is_empty() {
            err_msg = String::from_utf8_lossy(&output.stdout).to_string();
        }
        Err(err_msg)
    }
}

#[tauri::command]
pub fn git_show_file(path: String, file: String, ref_name: String) -> Result<String, String> {
    let target = format!("{}:{}", ref_name, file);
    let output = git_command()
        .args(["show", &target])
        .current_dir(&path)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
pub async fn git_set_remote(path: String, remote: String, url: String) -> Result<String, String> {
    // try to set-url first, if fails (remote doesn't exist), try to add it
    let mut output = git_command()
        .args(["remote", "set-url", &remote, &url])
        .current_dir(&path)
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        output = git_command()
            .args(["remote", "add", &remote, &url])
            .current_dir(&path)
            .output()
            .map_err(|e| e.to_string())?;
    }

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
pub async fn git_get_remote(path: String, remote: String) -> Result<String, String> {
    let output = git_command()
        .args(["remote", "get-url", &remote])
        .current_dir(&path)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
pub async fn git_get_remotes(path: String) -> Result<Vec<serde_json::Value>, String> {
    let output = git_command()
        .args(["remote", "-v"])
        .current_dir(&path)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        let mut remotes_map = std::collections::HashMap::new();
        
        for line in stdout.lines() {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 2 {
                let name = parts[0];
                let url = parts[1];
                remotes_map.insert(name.to_string(), url.to_string());
            }
        }
        
        let mut result = Vec::new();
        for (name, url) in remotes_map {
            result.push(serde_json::json!({
                "name": name,
                "url": url
            }));
        }
        Ok(result)
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
pub async fn git_remove_remote(path: String, remote: String) -> Result<String, String> {
    let output = git_command()
        .args(["remote", "remove", &remote])
        .current_dir(&path)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
pub async fn git_get_config(path: String, key: String) -> Result<String, String> {
    let output = git_command()
        .args(["config", "--local", &key])
        .current_dir(&path)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        Ok(String::new()) // Return empty string if not found locally
    }
}

#[tauri::command]
pub async fn git_set_config(path: String, key: String, value: String) -> Result<String, String> {
    let output = git_command()
        .args(["config", "--local", &key, &value])
        .current_dir(&path)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}
