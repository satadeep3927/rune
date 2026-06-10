pub mod indexer;
pub mod window;
pub mod terminal;
pub mod fs_utils;
pub mod search;
pub mod system;
pub mod git;

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::Manager;

use indexer::WorkspaceIndexer;
use window::{WindowContext, WindowManager, resolve_workspace};
use terminal::TerminalState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // On Windows, file associations and "Open with Rune" pass the path
    // as a CLI argument. Collect the first non-flag argument.
    let startup_path: Option<String> = std::env::args()
        .skip(1)
        .find(|a| !a.starts_with("--"));

    tauri::Builder::default()
        .manage(TerminalState { sessions: Mutex::new(HashMap::new()) })
        .manage(WorkspaceIndexer::new())
        .manage(WindowManager {
            windows: Mutex::new(HashMap::new()),
            counter: Mutex::new(0),
        })
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            window::handle_single_instance(app, argv, cwd);
        }))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            terminal::start_terminal, terminal::send_terminal_input, terminal::kill_terminal, terminal::resize_terminal, 
            system::load_startup, system::execute_command,
            search::index_workspace, search::update_file_index, search::get_completions,
            search::get_workspace_symbols, search::get_document_symbols, search::get_definition,
            search::get_indexed_files,
            window::get_window_context, window::register_window_workspace,
            fs_utils::read_clipboard_files, fs_utils::write_clipboard_files, search::workspace_search,
            fs_utils::parse_markdown, fs_utils::batch_copy_files, fs_utils::batch_move_files, search::fuzzy_search_files,
            fs_utils::get_expanded_tree, fs_utils::read_filtered_dir, fs_utils::delete_path_async,
            fs_utils::get_file_hash, fs_utils::check_file_update,
            git::get_git_state, git::git_commit, git::git_add, git::git_reset, git::git_push, git::git_pull, git::git_init, git::git_discard,
            git::git_list_branches, git::git_checkout, git::git_create_branch, git::git_show_file
        ])
          .setup(move |app| {
              let mut ctx = WindowContext::default();
              if let Some(path) = startup_path.clone() {
                  eprintln!("[rune] Initial launch arg: {}", path);
                  let cwd = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
                  let absolute_path = cwd.join(&path);
                  let canonical_path = std::fs::canonicalize(&absolute_path).unwrap_or(absolute_path);
                  let (workspace, file) = resolve_workspace(&canonical_path.to_string_lossy());
                  ctx.workspace = Some(workspace);
                  ctx.file_to_open = file;
              }
            
            let mgr = app.state::<WindowManager>();
            let mut windows = mgr.windows.lock().unwrap();
            windows.insert("main".to_string(), ctx);

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
