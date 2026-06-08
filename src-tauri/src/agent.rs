use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use futures::StreamExt;

// ── Types ──

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderConfig {
    pub provider: String,
    pub api_key: Option<String>,
    pub base_url: Option<String>,
    pub model: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolCall {
    pub id: String,
    pub name: String,
    pub input: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentContext {
    pub active_file_path: Option<String>,
    pub active_content: Option<String>,
    pub selection: Option<String>,
    pub language: Option<String>,
    pub workspace_root: Option<String>,
}

// ── Provider Enum ──

enum LlmProvider {
    Anthropic,
    OpenAI,
    OpenRouter,
    Zai,
    Ollama,
}

impl LlmProvider {
    fn from_name(name: &str) -> Self {
        match name {
            "anthropic" => Self::Anthropic,
            "openai" => Self::OpenAI,
            "openrouter" => Self::OpenRouter,
            "z-ai" => Self::Zai,
            "ollama" => Self::Ollama,
            _ => Self::OpenAI,
        }
    }

    fn default_base_url(&self) -> &str {
        match self {
            Self::Anthropic => "https://api.anthropic.com",
            Self::OpenAI => "https://api.openai.com",
            Self::OpenRouter => "https://openrouter.ai/api",
            Self::Zai => "https://api.z.ai",
            Self::Ollama => "http://localhost:11434",
        }
    }

    fn default_model(&self) -> &str {
        match self {
            Self::Anthropic => "claude-sonnet-4-6",
            Self::OpenAI => "gpt-4o",
            Self::OpenRouter => "anthropic/claude-sonnet-4-6",
            Self::Zai => "default",
            Self::Ollama => "llama3",
        }
    }

    async fn chat_stream(
        &self,
        messages: Vec<ChatMessage>,
        model: &str,
        api_key: &str,
        base_url: &str,
        context: &AgentContext,
        app: &AppHandle,
        session_id: &str,
    ) -> Result<(), String> {
        match self {
            Self::Anthropic => {
                stream_anthropic(messages, model, api_key, base_url, context, app, session_id).await
            }
            Self::OpenAI | Self::OpenRouter | Self::Zai => {
                stream_openai_compatible(messages, model, api_key, base_url, context, app, session_id).await
            }
            Self::Ollama => {
                stream_ollama(messages, model, base_url, context, app, session_id).await
            }
        }
    }
}

// ── Anthropic Streaming ──

async fn stream_anthropic(
    messages: Vec<ChatMessage>,
    model: &str,
    api_key: &str,
    base_url: &str,
    context: &AgentContext,
    app: &AppHandle,
    session_id: &str,
) -> Result<(), String> {
    let url = format!("{}/v1/messages", base_url);

    let mut system_prompt = String::from("You are a helpful coding assistant integrated into the Rune editor. You help users write, debug, and understand code.");
    if let Some(root) = &context.workspace_root {
        system_prompt.push_str(&format!("\n\nWorkspace: {}", root));
    }
    if let Some(lang) = &context.language {
        system_prompt.push_str(&format!("\nCurrent language: {}", lang));
    }

    let anthropic_messages: Vec<serde_json::Value> = messages.iter().map(|m| {
        serde_json::json!({ "role": m.role, "content": m.content })
    }).collect();

    let body = serde_json::json!({
        "model": model,
        "max_tokens": 4096,
        "stream": true,
        "system": system_prompt,
        "messages": anthropic_messages,
    });

    let client = reqwest::Client::new();
    let response = client
        .post(&url)
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(format!("API error {}: {}", status, text));
    }

    let mut stream = response.bytes_stream();
    let mut buffer = String::new();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| format!("Stream error: {}", e))?;
        buffer.push_str(&String::from_utf8_lossy(&chunk));

        while let Some(pos) = buffer.find("\n\n") {
            let event_text = buffer[..pos].to_string();
            buffer = buffer[pos + 2..].to_string();

            for line in event_text.lines() {
                if let Some(data) = line.strip_prefix("data: ") {
                    if data == "[DONE]" {
                        let _ = app.emit("agent-stream-done", serde_json::json!({ "sessionId": session_id }));
                        return Ok(());
                    }
                    if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(data) {
                        if let Some(delta) = parsed.get("delta") {
                            if delta.get("type").and_then(|t| t.as_str()) == Some("text_delta") {
                                if let Some(text) = delta.get("text").and_then(|t| t.as_str()) {
                                    let _ = app.emit("agent-stream-chunk", serde_json::json!({
                                        "sessionId": session_id,
                                        "chunk": text,
                                    }));
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    let _ = app.emit("agent-stream-done", serde_json::json!({ "sessionId": session_id }));
    Ok(())
}

// ── OpenAI-compatible Streaming ──

async fn stream_openai_compatible(
    messages: Vec<ChatMessage>,
    model: &str,
    api_key: &str,
    base_url: &str,
    context: &AgentContext,
    app: &AppHandle,
    session_id: &str,
) -> Result<(), String> {
    let url = format!("{}/v1/chat/completions", base_url);

    let mut system_prompt = String::from("You are a helpful coding assistant integrated into the Rune editor.");
    if let Some(root) = &context.workspace_root {
        system_prompt.push_str(&format!("\n\nWorkspace: {}", root));
    }
    if let Some(lang) = &context.language {
        system_prompt.push_str(&format!("\nCurrent language: {}", lang));
    }

    let mut all_messages = vec![serde_json::json!({
        "role": "system",
        "content": system_prompt,
    })];
    for m in &messages {
        all_messages.push(serde_json::json!({ "role": m.role, "content": m.content }));
    }

    let body = serde_json::json!({
        "model": model,
        "stream": true,
        "messages": all_messages,
    });

    let client = reqwest::Client::new();
    let response = client
        .post(&url)
        .header("authorization", format!("Bearer {}", api_key))
        .header("content-type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(format!("API error {}: {}", status, text));
    }

    let mut stream = response.bytes_stream();
    let mut buffer = String::new();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| format!("Stream error: {}", e))?;
        buffer.push_str(&String::from_utf8_lossy(&chunk));

        while let Some(pos) = buffer.find("\n\n") {
            let event_text = buffer[..pos].to_string();
            buffer = buffer[pos + 2..].to_string();

            for line in event_text.lines() {
                if let Some(data) = line.strip_prefix("data: ") {
                    if data == "[DONE]" {
                        let _ = app.emit("agent-stream-done", serde_json::json!({ "sessionId": session_id }));
                        return Ok(());
                    }
                    if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(data) {
                        if let Some(choices) = parsed.get("choices").and_then(|c| c.as_array()) {
                            for choice in choices {
                                if let Some(content) = choice.get("delta").and_then(|d| d.get("content")).and_then(|c| c.as_str()) {
                                    let _ = app.emit("agent-stream-chunk", serde_json::json!({
                                        "sessionId": session_id,
                                        "chunk": content,
                                    }));
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    let _ = app.emit("agent-stream-done", serde_json::json!({ "sessionId": session_id }));
    Ok(())
}

// ── Ollama Streaming ──

async fn stream_ollama(
    messages: Vec<ChatMessage>,
    model: &str,
    base_url: &str,
    context: &AgentContext,
    app: &AppHandle,
    session_id: &str,
) -> Result<(), String> {
    let url = format!("{}/api/chat", base_url);

    let mut system_prompt = String::from("You are a helpful coding assistant integrated into the Rune editor.");
    if let Some(root) = &context.workspace_root {
        system_prompt.push_str(&format!("\n\nWorkspace: {}", root));
    }

    let ollama_messages: Vec<serde_json::Value> = messages.iter().map(|m| {
        serde_json::json!({ "role": m.role, "content": m.content })
    }).collect();

    let body = serde_json::json!({
        "model": model,
        "stream": true,
        "messages": ollama_messages,
    });

    let client = reqwest::Client::new();
    let response = client
        .post(&url)
        .header("content-type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(format!("Ollama error {}: {}", status, text));
    }

    let mut stream = response.bytes_stream();
    let mut buffer = String::new();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| format!("Stream error: {}", e))?;
        buffer.push_str(&String::from_utf8_lossy(&chunk));

        while let Some(pos) = buffer.find('\n') {
            let line = buffer[..pos].to_string();
            buffer = buffer[pos + 1..].to_string();

            if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(&line) {
                if let Some(content) = parsed.get("message").and_then(|m| m.get("content")).and_then(|c| c.as_str()) {
                    let _ = app.emit("agent-stream-chunk", serde_json::json!({
                        "sessionId": session_id,
                        "chunk": content,
                    }));
                }
                if parsed.get("done").and_then(|d| d.as_bool()) == Some(true) {
                    let _ = app.emit("agent-stream-done", serde_json::json!({ "sessionId": session_id }));
                    return Ok(());
                }
            }
        }
    }

    let _ = app.emit("agent-stream-done", serde_json::json!({ "sessionId": session_id }));
    Ok(())
}

// ── Tauri Commands ──

#[tauri::command]
pub async fn agent_chat_stream(
    session_id: String,
    provider: String,
    messages: Vec<ChatMessage>,
    config: ProviderConfig,
    context: AgentContext,
    app: AppHandle,
) -> Result<(), String> {
    let p = LlmProvider::from_name(&provider);
    let base_url = config.base_url.as_deref().unwrap_or(p.default_base_url());
    let model = config.model.as_deref().unwrap_or(p.default_model());
    let api_key = config.api_key.as_deref().unwrap_or("");

    let result = p.chat_stream(messages, model, api_key, base_url, &context, &app, &session_id).await;

    if let Err(ref e) = result {
        let _ = app.emit("agent-stream-error", serde_json::json!({
            "sessionId": session_id,
            "error": e,
        }));
    }

    result
}

#[tauri::command]
pub async fn agent_list_models(
    provider: String,
    config: ProviderConfig,
) -> Result<Vec<serde_json::Value>, String> {
    let p = LlmProvider::from_name(&provider);
    let base_url = config.base_url.as_deref().unwrap_or(p.default_base_url());

    match &p {
        LlmProvider::Ollama => {
            let client = reqwest::Client::new();
            let response = client
                .get(&format!("{}/api/tags", base_url))
                .send()
                .await
                .map_err(|e| format!("Failed to fetch Ollama models: {}", e))?;
            let body: serde_json::Value = response.json().await.map_err(|e| format!("Parse error: {}", e))?;
            let models = body.get("models")
                .and_then(|m| m.as_array())
                .map(|arr| arr.iter().filter_map(|m| {
                    m.get("name").and_then(|n| n.as_str()).map(|name| {
                        serde_json::json!({ "id": name, "name": name })
                    })
                }).collect())
                .unwrap_or_default();
            Ok(models)
        }
        LlmProvider::OpenRouter => {
            let client = reqwest::Client::new();
            let api_key = config.api_key.as_deref().unwrap_or("");
            let response = client
                .get(&format!("{}/v1/models", base_url))
                .header("authorization", format!("Bearer {}", api_key))
                .send()
                .await
                .map_err(|e| format!("Failed to fetch models: {}", e))?;
            let body: serde_json::Value = response.json().await.map_err(|e| format!("Parse error: {}", e))?;
            let models = body.get("data")
                .and_then(|d| d.as_array())
                .map(|arr| arr.iter().filter_map(|m| {
                    m.get("id").and_then(|id| id.as_str()).map(|id| {
                        serde_json::json!({ "id": id, "name": id })
                    })
                }).collect())
                .unwrap_or_default();
            Ok(models)
        }
        LlmProvider::Anthropic => {
            Ok(vec![
                serde_json::json!({ "id": "claude-sonnet-4-6", "name": "Claude Sonnet 4.6" }),
                serde_json::json!({ "id": "claude-opus-4-7", "name": "Claude Opus 4.7" }),
                serde_json::json!({ "id": "claude-haiku-4-5", "name": "Claude Haiku 4.5" }),
            ])
        }
        LlmProvider::OpenAI => {
            Ok(vec![
                serde_json::json!({ "id": "gpt-4o", "name": "GPT-4o" }),
                serde_json::json!({ "id": "gpt-5", "name": "GPT-5" }),
                serde_json::json!({ "id": "o3", "name": "o3" }),
            ])
        }
        _ => Ok(vec![]),
    }
}

#[tauri::command]
pub async fn agent_execute_tool(
    tool_name: String,
    input: serde_json::Value,
) -> Result<serde_json::Value, String> {
    match tool_name.as_str() {
        "read_file" => {
            let path = input.get("path").and_then(|p| p.as_str()).ok_or("Missing path")?;
            let content = std::fs::read_to_string(path).map_err(|e| format!("Read error: {}", e))?;
            Ok(serde_json::json!({ "content": content }))
        }
        "write_file" => {
            let path = input.get("path").and_then(|p| p.as_str()).ok_or("Missing path")?;
            let content = input.get("content").and_then(|c| c.as_str()).ok_or("Missing content")?;
            std::fs::write(path, content).map_err(|e| format!("Write error: {}", e))?;
            Ok(serde_json::json!({ "success": true }))
        }
        "execute_command" => {
            let command = input.get("command").and_then(|c| c.as_str()).ok_or("Missing command")?;
            let args: Vec<String> = input.get("args")
                .and_then(|a| a.as_array())
                .map(|arr| arr.iter().filter_map(|v| v.as_str().map(String::from)).collect())
                .unwrap_or_default();

            let output = if cfg!(target_os = "windows") {
                let mut all_args = vec!["/C".to_string(), command.to_string()];
                all_args.extend(args);
                std::process::Command::new("cmd").args(&all_args).output()
            } else {
                std::process::Command::new(command).args(&args).output()
            };

            match output {
                Ok(out) => Ok(serde_json::json!({
                    "stdout": String::from_utf8_lossy(&out.stdout).to_string(),
                    "stderr": String::from_utf8_lossy(&out.stderr).to_string(),
                    "exitCode": out.status.code().unwrap_or(-1),
                })),
                Err(e) => Err(format!("Command failed: {}", e)),
            }
        }
        "list_dir" => {
            let path = input.get("path").and_then(|p| p.as_str()).ok_or("Missing path")?;
            let entries: Vec<serde_json::Value> = std::fs::read_dir(path)
                .map_err(|e| format!("Read dir error: {}", e))?
                .filter_map(|e| e.ok())
                .map(|e| {
                    let is_dir = e.path().is_dir();
                    serde_json::json!({
                        "name": e.file_name().to_string_lossy(),
                        "isDirectory": is_dir,
                    })
                })
                .collect();
            Ok(serde_json::json!({ "entries": entries }))
        }
        _ => Err(format!("Unknown tool: {}", tool_name)),
    }
}
