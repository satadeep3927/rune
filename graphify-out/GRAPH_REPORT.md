# Graph Report - src/ + src-tauri/  (2026-06-02)

## Corpus Check
- Corpus is ~16,004 words - fits in a single context window. You may not need a graph.

## Summary
- 355 nodes · 536 edges · 24 communities (19 shown, 5 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 31 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Settings & Terminal UI|Settings & Terminal UI]]
- [[_COMMUNITY_Modal Overlays|Modal Overlays]]
- [[_COMMUNITY_App Orchestrator|App Orchestrator]]
- [[_COMMUNITY_Theme & Editor Config|Theme & Editor Config]]
- [[_COMMUNITY_Tab Management|Tab Management]]
- [[_COMMUNITY_CodeMirror Editor|CodeMirror Editor]]
- [[_COMMUNITY_CodeMirror Internals|CodeMirror Internals]]
- [[_COMMUNITY_File Tree & FileSystem|File Tree & FileSystem]]
- [[_COMMUNITY_File Tree Components|File Tree Components]]
- [[_COMMUNITY_Tauri Configuration|Tauri Configuration]]
- [[_COMMUNITY_Rust Build & Capabilities|Rust Build & Capabilities]]
- [[_COMMUNITY_File Viewers|File Viewers]]
- [[_COMMUNITY_Titlebar & Menus|Titlebar & Menus]]
- [[_COMMUNITY_File Utilities|File Utilities]]
- [[_COMMUNITY_Workspace Settings|Workspace Settings]]
- [[_COMMUNITY_Editor Exports|Editor Exports]]
- [[_COMMUNITY_File Tree Exports|File Tree Exports]]
- [[_COMMUNITY_Keyboard Shortcuts|Keyboard Shortcuts]]
- [[_COMMUNITY_Icon Map Loader|Icon Map Loader]]
- [[_COMMUNITY_Theme Context Hook|Theme Context Hook]]

## God Nodes (most connected - your core abstractions)
1. `AppContent Component` - 16 edges
2. `TerminalSession` - 10 edges
3. `TerminalState` - 8 edges
4. `GlobalSettings` - 7 edges
5. `FileEntry` - 7 edges
6. `start_terminal()` - 7 edges
7. `Editor Component` - 7 edges
8. `FileTreeNode Component` - 7 edges
9. `Tab Store` - 7 edges
10. `Tab` - 6 edges

## Surprising Connections (you probably didn't know these)
- `CodeMirrorView Component` --shares_data_with--> `TerminalInstance Component`  [INFERRED]
  src/features/editor/CodeMirrorView.tsx → src/components/TerminalPanel.tsx
- `Tab Store` --shares_data_with--> `Settings Store (UI state)`  [INFERRED]
  src/stores/tabs.ts → src/stores/settings.ts
- `AppContent()` --calls--> `EditingItem`  [EXTRACTED]
  src/App.tsx → src/features/file-tree/FileTreeNode.tsx
- `EditorProps` --references--> `FileType`  [EXTRACTED]
  src/features/editor/Editor.tsx → src/types/index.ts
- `TabProps` --references--> `Tab`  [EXTRACTED]
  src/features/editor/Tab.tsx → src/types/index.ts

## Import Cycles
- 1-file cycle: `src-tauri/src/lib.rs -> src-tauri/src/lib.rs`

## Hyperedges (group relationships)
- **he_split_editor_sync** — Editor_Editor, CodeMirrorView_CodeMirrorView, MarkdownPreview_MarkdownPreview [EXTRACTED 1.00]
- **he_file_type_routing** — Editor_Editor, CodeMirrorView_CodeMirrorView, ImageViewer_ImageViewer, PdfViewer_PdfViewer, MarkdownPreview_MarkdownPreview, SettingsView_SettingsView [EXTRACTED 1.00]
- **he_command_palette_actions** — App_commands, App_handleSave, App_handleSaveAs, App_handleCloseTab, App_menuActions [EXTRACTED 1.00]
- **he_terminal_lifecycle** — TerminalPanel_TerminalPanel, TerminalPanel_TerminalInstance, TerminalPanel_initTerminal, TerminalPanel_getTerminalTheme [EXTRACTED 1.00]
- **he_settings_forms** — SettingsView_SettingsView, SettingsView_GlobalSettingsForm, SettingsView_WorkspaceSettingsForm, SettingsView_SettingRow, SettingsView_CustomSelect, SettingsView_ColorPicker [EXTRACTED 1.00]
- **Recursive File Tree Rendering** —  [EXTRACTED 1.00]
- **Theme Application Pipeline** —  [EXTRACTED 1.00]
- **Titlebar Composition** —  [EXTRACTED 1.00]
- **CodeMirror Editor Setup Pipeline** —  [EXTRACTED 1.00]
- **File System Operations Pipeline** —  [EXTRACTED 1.00]

## Communities (24 total, 5 thin omitted)

### Community 0 - "Settings & Terminal UI"
Cohesion: 0.08
Nodes (21): SettingsView(), TerminalInstanceProps, TerminalPanel(), TerminalPanelProps, TermTab, DEFAULT_GLOBAL, DEFAULT_WORKSPACE, GlobalSettings (+13 more)

### Community 1 - "Modal Overlays"
Cohesion: 0.09
Nodes (21): CommandItem, CommandPalette(), CommandPaletteProps, ConfirmDialog(), ConfirmDialogProps, ContextMenu(), ContextMenuItem, ContextMenuProps (+13 more)

### Community 2 - "App Orchestrator"
Cohesion: 0.10
Nodes (30): App Component, AppContent Component, Command Definitions Factory, confirmDelete Handler, deleteSelectedPath Handler, handleCloseTab Handler, handleEditorChange Handler, handleFileClick Handler (+22 more)

### Community 3 - "Theme & Editor Config"
Cohesion: 0.07
Nodes (29): useCodeMirror Hook, getLanguageExtension Helper, fileExtensionToLanguage Helper, Global Settings Store, ThemeProvider Component, Cyan Theme, Cyberpunk Theme, Dracula Theme (+21 more)

### Community 4 - "Tab Management"
Cohesion: 0.08
Nodes (12): [activeTabId, setActiveTabId], closeTab(), closeTabsForPath(), [focusedPane, setFocusedPane], getActiveTab(), getFocusedTab(), getRightActiveTab(), [rightActiveTabId, setRightActiveTabId] (+4 more)

### Community 5 - "CodeMirror Editor"
Cohesion: 0.13
Nodes (18): createRuneTheme(), CodeMirrorView(), CodeMirrorViewProps, Editor(), EditorProps, MdMode, ImageViewer(), ImageViewerProps (+10 more)

### Community 6 - "CodeMirror Internals"
Cohesion: 0.12
Nodes (21): AppHandle, Arc, Box, Child, HashMap, UseCodeMirrorOptions, MasterPty, Mutex (+13 more)

### Community 7 - "File Tree & FileSystem"
Cohesion: 0.11
Nodes (26): FileIcon Component, FileTree Component, FileTreeNode Component, IndentGuides Component, InlineInput Component, useFileSystem Hook, readDirectory Helper, refreshPreservingExpanded Helper (+18 more)

### Community 8 - "File Tree Components"
Cohesion: 0.15
Nodes (17): FileIcon(), FileIconProps, FileTree(), FileTreeProps, EditingItem, EditingMode, FileTreeNode(), FileTreeNodeProps (+9 more)

### Community 9 - "Tauri Configuration"
Cohesion: 0.09
Nodes (21): app, security, windows, build, beforeBuildCommand, beforeDevCommand, devUrl, frontendDist (+13 more)

### Community 10 - "Rust Build & Capabilities"
Cohesion: 0.13
Nodes (18): Tauri Build Script, description, identifier, permissions, $schema, windows, App Entry Point (index.tsx), TerminalState Struct (+10 more)

### Community 11 - "File Viewers"
Cohesion: 0.17
Nodes (15): CodeMirrorView Component, getLanguageExtension Function, Editor Component, ImageViewer Component, MarkdownPreview Component, syncFromEditor Scroll Sync, syncFromPreview Scroll Sync, PdfViewer Component (+7 more)

### Community 12 - "Titlebar & Menus"
Cohesion: 0.30
Nodes (8): MenuActions, MenuBar(), MenuBarProps, Titlebar(), TitlebarProps, WindowControls(), MenuDefinition, MenuItem

### Community 13 - "File Utilities"
Cohesion: 0.18
Nodes (4): IMAGE_EXTS, shouldSkip(), Workspace Settings Store, WorkspaceSettings

### Community 14 - "Workspace Settings"
Cohesion: 0.67
Nodes (3): WorkspaceSettings Interface, loadWorkspaceSettings Function, saveWorkspaceSettings Function

## Knowledge Gaps
- **116 isolated node(s):** `CommandPaletteProps`, `ConfirmDialogProps`, `ContextMenuProps`, `TerminalPanelProps`, `TermTab` (+111 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ThemeProvider Component` connect `Theme & Editor Config` to `File Tree & FileSystem`?**
  _High betweenness centrality (0.122) - this node is a cross-community bridge._
- **Why does `State` connect `CodeMirror Internals` to `CodeMirror Editor`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Why does `applyThemeToDOM Function` connect `File Tree & FileSystem` to `Theme & Editor Config`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **What connects `CommandPaletteProps`, `ConfirmDialogProps`, `ContextMenuProps` to the rest of the system?**
  _116 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Settings & Terminal UI` be split into smaller, more focused modules?**
  _Cohesion score 0.08235294117647059 - nodes in this community are weakly interconnected._
- **Should `Modal Overlays` be split into smaller, more focused modules?**
  _Cohesion score 0.08602150537634409 - nodes in this community are weakly interconnected._
- **Should `App Orchestrator` be split into smaller, more focused modules?**
  _Cohesion score 0.09885057471264368 - nodes in this community are weakly interconnected._