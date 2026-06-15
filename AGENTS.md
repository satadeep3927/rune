# Rune Editor Agent Notes

## Verified sources of truth

- Prefer executable sources (`package.json`, `tauri.conf.json`, `tsconfig*.json`, `src-tauri/src/lib.rs`) over README/CLAUDE when they conflict.
- `CLAUDE.md` has useful design/shortcut notes, but parts of its directory map and dependency list are stale.
- No repo-local OpenCode config, CI workflows, test suite, or lint script was found.

## Commands

- `pnpm install` installs frontend dependencies.
- `pnpm dev` runs the Vite dev server only; Vite port is strict `1420`.
- `pnpm tauri dev` runs the Tauri app and starts Vite via `tauri.conf.json`.
- `pnpm build` builds the frontend into `dist`.
- `pnpm tauri build` runs `pnpm build` then builds the Tauri app.
- `pnpm serve` previews `dist`.
- Rust backend check: `cargo check --manifest-path src-tauri/Cargo.toml`.
- No lint/test/typecheck scripts are defined; TypeScript is strict with `noUnusedLocals` and `noUnusedParameters`.

## Knowledge graph

- `index.html` injects the persisted theme before `src/index.tsx` renders `App`.
- `src/App.tsx` wraps `ThemeProvider`, `src/app/MainLayout.tsx`, and `UpdaterPopup`.
- `MainLayout` composes titlebar, sidebar, editor panes, terminal, command palette, workspace search, dialogs, toasts, and context menus.
- `src/app/EditorPane.tsx` owns per-pane rendering for left/right split panes.
- `src/features/editor/Editor.tsx` routes tabs to CodeMirror, merge view, image/PDF viewers, markdown preview, settings, or git settings by `fileType`.
- `src/stores/tabs.ts` is the tab source of truth: left/right panes, dirty state, active pane, localStorage persistence, and conflict state.
- `src/hooks/useFileSystem.ts` plus Rust `fs_utils` own the file tree; directory watchers are lazy and non-recursive.
- `src/stores/settings.ts` plus Rust `system::load_startup` own global `$HOME/.rune/settings.json` and workspace `.rune/settings.json`.
- `src/plugins/index.ts` initializes built-in plugins; `src/plugins/api.ts` and `src/plugins/registry.ts` define extension points.
- `src-tauri/src/main.rs` calls `rune_editor_lib::run()`; `src-tauri/src/lib.rs` registers all Tauri commands.

## Backend module map

- `fs_utils.rs`: filtered tree reads, copy/move/delete, clipboard files, markdown parsing, file hashes, external-change checks.
- `clipboard.rs`: native text clipboard read/write/has-text commands.
- `search.rs` and `indexer.rs`: workspace search, fuzzy file search, completions, symbols, definitions.
- `terminal.rs`: portable PTY terminal sessions; Windows uses `powershell.exe`, non-Windows uses `bash`.
- `window.rs`: startup context, multi-window routing, `open-path` event handling for file associations.
- `git.rs`: direct `git` command wrappers used by the Git UI.
- `agent.rs` exists but is not registered in `lib.rs`, so `agent_chat_stream` is not wired.

## Critical behavior gotchas

- File associations/CLI args: Rust captures the first non-flag arg; files open with their parent as workspace and `file_to_open` consumed by `get_window_context`.
- Tauri custom titlebar requires `decorations: false`, `data-tauri-drag-region` on drag areas, and no-drag regions on controls.
- `src-tauri/capabilities/default.json` grants broad filesystem/dialog/window permissions under `**`; edit carefully.
- CodeMirror enables multi-selection and column selection; dirty tracking normalizes CRLF to LF.
- Tab CodeMirror state and scroll are cached per tab id; undo history is preserved across tab switches.
- `Mod-Shift-z` explicitly redoes on Windows because CodeMirror otherwise relies on Ctrl+Y.
- F12 definition uses `get_definition`, then dispatches `rune-open-file` and `rune-goto-line-path`.
- Find/replace is driven by `rune-editor-find` / `rune-editor-replace` custom events, not a built-in panel.
- Active file watcher uses Rust hashes: clean files reload, dirty files raise a conflict.
- Terminal `TerminalInstance` must stay padding-free; padding breaks xterm canvas/cell alignment.
- Workspace search is Rust-backed, respects `.gitignore`, includes hidden files, and caps results at 500.
- Indexer skips hidden/build dirs, symlinks, binary/lock extensions, and files over 2 MB.
- Markdown preview calls Rust `parse_markdown`; do not add a JS markdown renderer unless a new feature needs one.
- File type mapping handles double extensions: `.blade.php`, `.d.ts`, `.module.css`.

## Useful shortcuts

- `Ctrl+P`: file search palette.
- `Ctrl+T`: workspace symbol search.
- `Ctrl+Shift+O`: document outline.
- `Ctrl+F5`: run active file.
- `Ctrl+K Ctrl+O`: open folder.
- Core save/navigation shortcuts are in `src/hooks/useAppCommands.ts`.

## Style and architecture conventions

- Use `@/*` for `src/*` imports.
- Keep reactive orchestration in `src/hooks/*` and feature-local state in `src/features/*`; components should stay thin.
- Minimize Tauri IPC; prefer batched Rust commands and JS-side path joins.
- Use CSS variables from `src/styles/index.css`; default theme is sharp, high-contrast, dark, with lime accents.
- Body is `user-select: none`; editor content is the intentional selectable area.
