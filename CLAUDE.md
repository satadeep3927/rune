# Rune Editor

A lightweight, extensible code editor built with Tauri 2 + SolidJS + Rust.

## Tech Stack

| Layer | Tech |
|-------|------|
| Shell | Tauri 2 (Rust backend) |
| Frontend | SolidJS, TypeScript |
| Styling | Tailwind CSS v4 |
| State | Solid signals + stores |
| Editor | CodeMirror 6 |
| Terminal | xterm.js |

## Architecture Principles

- **Modular design** — every feature lives in its own directory under `src/` with its own components, hooks, and types.
- **Custom hooks over inline logic** — extract reactive logic into `src/hooks/` or feature-local hooks. Components should be thin wrappers.
- **Sharp design** — hard edges, no border-radius excessive, crisp lines. Default theme: dark bg (#0B0F00) + lime (#00ff41) accents.
- **Minimize Tauri IPC** — batch Rust commands (e.g. `load_startup`) to avoid serialized round-trips. Use JS-side path manipulation (`joinPath()`) instead of Tauri's `join()`.
- **Lazy file watching** — per-directory watchers that start on expand and stop on collapse, not recursive from root.

## Directory Structure

```
src/
  App.tsx               # Root component, orchestrates all features
  components/
    CommandPalette.tsx   # Ctrl+Shift+P command palette
    ConfirmDialog.tsx    # Modal confirm for delete/rename
    ContextMenu.tsx      # Right-click context menu
    SettingsView.tsx     # Settings UI tab
    TerminalPanel.tsx    # xterm.js terminal panel
    WorkspaceSearch.tsx  # Ctrl+Shift+F workspace search
  features/
    editor/
      CodeMirrorView.tsx  # CodeMirror 6 wrapper with tab switch, context menu
      cmTheme.ts          # Editor theme (Obsidian + Lime)
      Editor.tsx          # Routes to correct viewer (text/image/pdf/markdown)
      ImageViewer.tsx     # Image file viewer
      MarkdownPreview.tsx # Rendered markdown preview
      PdfViewer.tsx       # PDF embed viewer
      Tab.tsx             # Single tab component
      TabBar.tsx          # Tab bar with scroll, context menu, split panes
    file-tree/
      FileIcon.tsx        # File type icons (inline SVG)
      FileTreeNode.tsx    # Recursive tree node with multi-select, rename
      FileTree.tsx        # Sidebar tree with keyboard nav (arrows, shift-select)
    theme/
      ThemeProvider.tsx   # Theme context + CSS variable application
      themes.ts           # Theme color definitions (dark/light)
    titlebar/
      MenuBar.tsx         # Dropdown menu bar
      Titlebar.tsx        # Custom titlebar with menus + window controls
      WindowControls.tsx  # Min/max/close buttons
  hooks/
    useFileSystem.ts     # File tree, read/write, lazy watchers
    useKeyboardShortcuts.ts  # Global keyboard shortcut + chord handler
    useMenuDefinitions.ts    # File/Edit/View/Help menu structure
    useTheme.ts          # Theme toggle hook
    useWindowControls.ts # Window min/max/close via Tauri
  stores/
    settings.ts          # Global + workspace settings (batched load_startup)
    tabs.ts              # Tab state, multi-pane, dirty tracking
  styles/
    index.css            # Tailwind entry, CSS variables, scrollbar, markdown preview
  types/
    index.ts             # Shared types (FileEntry, Tab, FileType, etc.)
  utils/
    iconMap.ts           # SVG icon fetch cache for file icons
```

## Commands

```bash
pnpm install          # Install frontend deps
pnpm tauri dev        # Dev server + Tauri window
pnpm tauri build      # Production build
pnpm build            # Frontend-only build
```

## Design System

- Default theme: **Obsidian + Lime** — dark backgrounds (`#0B0F00`), lime accents (`#00ff41`), monospace everything.
- All colors driven by CSS custom properties so themes are swappable.
- Sharp corners (border-radius: 0 or 2px max). No soft/rounded UI.
- Thin 1px borders, high contrast.
- `user-select: none` on body; `user-select: text` on `.cm-content` only.

## Key Dependencies

- `tailwindcss` + `@tailwindcss/vite` (v4)
- CodeMirror 6: `@codemirror/view`, `@codemirror/state`, `@codemirror/commands`, `@codemirror/autocomplete`, `@codemirror/language`, `@codemirror/search`, `@codemirror/lang-*`
- `@tauri-apps/plugin-fs`, `@tauri-apps/plugin-dialog`, `@tauri-apps/plugin-opener`, `@tauri-apps/plugin-shell`
- `xterm` + `@xterm/addon-fit` — integrated terminal
- `marked` — markdown preview rendering
- `lucide-solid` — sidebar icons

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+S | Save |
| Ctrl+Alt+S | Save All |
| Ctrl+Shift+S | Save As |
| Ctrl+N | New File |
| Ctrl+W | Close Tab |
| Ctrl+Tab / Ctrl+Shift+Tab | Cycle tabs |
| Ctrl+B | Toggle sidebar |
| Ctrl+\` | Toggle terminal |
| Ctrl+Shift+P | Command palette |
| Ctrl+Shift+F | Find in workspace |
| Ctrl+K Ctrl+O | Open folder |

## Tauri Notes

- Custom titlebar requires `decorations: false` in tauri.conf.json + `data-tauri-drag-region` on the titlebar element.
- File system access via Tauri plugins (`fs`, `dialog`, `opener`).
- Batched `load_startup` Rust command reads both settings files in one IPC call using `std::fs`.
- CLI args handled in Rust `lib.rs` — emits `open-path` event for file/folder associations.
- WebView2 flash fix: `backgroundColor: "#0B0F00"` in tauri.conf.json window config.

## CodeMirror Notes

- Tab switching uses `view.setState()` to reset undo history per tab.
- `EditorState.allowMultipleSelections.of(true)` enables multi-cursor (Ctrl+Alt+Up/Down, Ctrl+Click, Alt+drag).
- `crosshairCursor()` for column selection.
- Explicit `Mod-Shift-z` redo binding added (CodeMirror only had Ctrl+Y on Windows).
- Dirty state: `savedContent` normalized to `\n` line endings to match CodeMirror output.

## File Tree Notes

- Multi-selection via Ctrl+Click; Shift+Arrow for range select.
- Arrow keys navigate, Enter opens/toggles, Left collapses or goes to parent.
- Lazy file watching: `recursive: false` per-directory, started on expand, stopped on collapse.
- Double extensions handled: `.blade.php`, `.d.ts`, `.module.css`.
