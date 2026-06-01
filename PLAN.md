# Rune Editor — Implementation Plan

## Phase 0: Project Bootstrap
- [ ] Initialize git repo
- [ ] Install Tailwind CSS v4 + Vite plugin
- [ ] Install CodeMirror 6 core packages
- [ ] Install SolidJS-compatible component primitives (Kobalte / Hope UI / raw Radix)
- [ ] Configure Tailwind with custom theme tokens (colors, spacing, fonts)
- [ ] Set up CSS custom properties for theming
- [ ] Create target directory structure under `src/`
- [ ] Strip scaffold code (greet example, App.css, logo assets)

## Phase 1: Theme System
- [ ] Define theme types (`ThemeConfig`, color tokens)
- [ ] Create `src/features/theme/` with ThemeProvider context
- [ ] Implement "Obsidian + Lime" as default theme
- [ ] Add a second theme (e.g., "Frost" — dark blue + cyan)
- [ ] Create `useTheme()` hook returning current theme + setter
- [ ] Wire CSS custom properties to active theme
- [ ] Persist theme choice in localStorage

## Phase 2: Custom Titlebar + Menus
- [ ] Set `decorations: false` in tauri.conf.json
- [ ] Create `src/features/titlebar/Titlebar.tsx`
- [ ] Add `data-tauri-drag-region` for window dragging
- [ ] Implement window controls (minimize, maximize, close) via Tauri API
- [ ] Build menu bar (File, Edit, View, Help) as dropdown menus
- [ ] Create `useWindowControls()` hook for minimize/maximize/close
- [ ] Create `useMenuActions()` hook mapping menu items to actions
- [ ] Style titlebar with theme tokens

## Phase 3: File Tree
- [ ] Add Tauri Rust commands: `list_dir`, `read_file`, `write_file`
- [ ] Register `fs` and `dialog` Tauri plugins in Cargo.toml + capabilities
- [ ] Create `src/features/file-tree/FileTree.tsx`
- [ ] Create `useFileTree()` hook — lazy-load directory contents on expand
- [ ] Create `useFileSystem()` hook — wraps Tauri commands with TanStack Query
- [ ] Implement folder expand/collapse, file icons by extension
- [ ] Wire file click → open in editor (emit to tab store)
- [ ] Add context menu (new file, new folder, rename, delete)
- [ ] Style file tree with theme tokens

## Phase 4: Editor (CodeMirror)
- [ ] Create `src/features/editor/CodeMirrorEditor.tsx`
- [ ] Create `useCodeMirror()` hook — initializes CM6 instance, returns ref
- [ ] Set up basic extensions: line numbers, bracket matching, active line highlight
- [ ] Add syntax highlighting (start with JS/TS lang package)
- [ ] Add autocompletion extension
- [ ] Bind editor content to a Solid signal for dirty-state tracking
- [ ] Add save handler (Cmd/Ctrl+S) → write file via Tauri
- [ ] Style CodeMirror to match theme (dark bg, lime gutters/borders)
- [ ] Make CM theme reactive — swap when theme changes

## Phase 5: Multi-Tab System
- [ ] Define tab types: `Tab { id, path, name, content, isDirty, language }`
- [ ] Create global tab store in `src/stores/tabs.ts` using Solid signals
- [ ] Create `src/features/editor/TabBar.tsx` — horizontal tab strip
- [ ] Create `useTabs()` hook — open, close, switch, reorder tabs
- [ ] Implement tab close with unsaved-changes confirmation
- [ ] Show dirty indicator (dot or *) on modified tabs
- [ ] Only mount active tab's CodeMirror instance (lazy mount/unmount)
- [ ] Wire: file-tree click → open tab, tab close → remove, Cmd+W → close current

## Phase 6: Integration & Polish
- [ ] Wire menus to real actions (File > Open, File > Save, View > Toggle Sidebar)
- [ ] Add keyboard shortcuts overlay or mapping
- [ ] Responsive layout: sidebar resizable or toggleable
- [ ] Status bar at bottom (file path, line:col, language)
- [ ] Loading states and error boundaries
- [ ] Test: open folder, navigate tree, open multiple files, edit, save, switch themes
- [ ] Clean up unused scaffold code and assets

---

## Agent Assignment Plan

| Agent | Phase(s) | Scope |
|-------|----------|-------|
| **Agent A: Bootstrapper** | Phase 0 | Install all deps, configure Tailwind, create dirs, strip scaffold |
| **Agent B: Theming** | Phase 1 | Full theme system — types, provider, hooks, CSS vars, persistence |
| **Agent C: Titlebar** | Phase 2 | Custom titlebar, menus, window controls, Tauri config changes |
| **Agent D: File Tree** | Phase 3 | Rust commands, file tree UI, hooks, context menus |
| **Agent E: Editor** | Phase 4 | CodeMirror integration, extensions, theme binding |
| **Agent F: Tabs** | Phase 5 | Tab store, tab bar, multi-tab orchestration |
| **Agent G: Integration** | Phase 6 | Wire everything together, polish, shortcuts, status bar |

Execution order: A → B (parallel with C) → D + E (parallel) → F → G
