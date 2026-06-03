import { onMount, createSignal, createEffect, Show } from "solid-js";
import { ThemeProvider } from "./features/theme";
import { Titlebar } from "./features/titlebar";
import { FileTree } from "./features/file-tree";
import { Editor, TabBar } from "./features/editor";
import { ContextMenu, type ContextMenuItem } from "./components/ContextMenu";
import { CommandPalette, type CommandItem } from "./components/CommandPalette";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { WorkspaceSearch } from "./components/WorkspaceSearch";
import { TerminalPanel } from "./components/TerminalPanel";

import { useMenuDefinitions } from "./hooks/useMenuDefinitions";
import { useFileSystem } from "./hooks/useFileSystem";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { loadAllSettings, globalSettings, workspaceSettings } from "./stores/settings";
import { tabStore } from "./stores/tabs";
import { settingsStore } from "./stores/settings";
import { loadIconMap } from "./utils/iconMap";
import type { FileEntry, PaneSide } from "./types";
import type { EditingMode } from "./features/file-tree/FileTreeNode";
import "./styles/index.css";

const ABOUT_RUNE_MARKDOWN = `# About Rune Editor

Rune is a lightweight, lightning-fast code editor built with modern web technologies and Rust.

## Key Features

- ⚡ **High Performance**: Powered by a Rust backend (Tauri) and CodeMirror 6 editor engine.
- 🌳 **Workspace Tree**: Full directory tree view with file system integration and no restrictions.
- 🔍 **Workspace Search**: Search text across all your files instantly.
- 🎨 **Minimalist Design**: Curated dark green theme with a glowing lime-green accent.
- 🔀 **Split Editor Panes**: View and edit files side-by-side.
- ⌨️ **Keyboard Centric**: Native keyboard shortcuts and chord sequences.
- 🖱️ **Smooth Tab Scrolling**: Scroll horizontally across open tabs using your mouse wheel.

## Tech Stack

- **Framework**: SolidJS & TypeScript
- **Runtime**: Tauri (Rust)
- **Editor Engine**: CodeMirror 6
- **Styling**: Tailwind CSS

---
*Rune Editor is open source and released under the MIT License.*
`;


export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const fs = useFileSystem();
  const [ctxMenu, setCtxMenu] = createSignal<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);
  const [showCommandPalette, setShowCommandPalette] = createSignal(false);
  const [showWorkspaceSearch, setShowWorkspaceSearch] = createSignal(false);
  const [showTerminal, setShowTerminal] = createSignal(false);
  const [terminalHeight, setTerminalHeight] = createSignal(240);
  const [editingItem, setEditingItem] = createSignal<{ parentPath: string; mode: EditingMode } | null>(null);
  const [confirmState, setConfirmState] = createSignal<{ message: string; detail?: string; onConfirm: () => void } | null>(null);
  const [selectedPaths, setSelectedPaths] = createSignal<Set<string>>(new Set());

  let previousRoot: string | null = null;

  onMount(() => {
    const t0 = performance.now();
    console.log(`[rune] onMount: ${Math.round(t0)}ms`);

    // Show window immediately — don't wait for I/O
    (async () => {
      try {
        const { getCurrentWebviewWindow } = await import("@tauri-apps/api/webviewWindow");
        getCurrentWebviewWindow().show().catch(() => {});
        console.log(`[rune] window.show(): ${Math.round(performance.now() - t0)}ms`);
      } catch (e) {}
    })();

    // Init filesystem — this is the hot path for workspace restore
    console.time("[rune] fs.init");
    fs.init().then(() => {
      console.log(`[rune] fs.init done: ${Math.round(performance.now() - t0)}ms`);
    });

    // Load settings and icons in background — don't block
    loadIconMap();

    // Batch-load all settings in a single IPC call
    loadAllSettings(fs.rootPath()).then(() => {
      console.log(`[rune] loadAllSettings done: ${Math.round(performance.now() - t0)}ms`);
    });

    (async () => {
      try {
        const { getCurrentWebviewWindow } = await import("@tauri-apps/api/webviewWindow");
        setTimeout(() => {
          getCurrentWebviewWindow().show().catch(() => {});
        }, 50);
      } catch (e) {}

      // Handle "Open with Rune" / "Open as Rune Project" CLI arg + file association
      try {
        const { listen } = await import("@tauri-apps/api/event");
        const { stat } = await import("@tauri-apps/plugin-fs");
        const { getCurrentWebviewWindow } = await import("@tauri-apps/api/webviewWindow");
        await listen<string>("open-path", async (event) => {
          let path = event.payload;
          console.log(`[rune] open-path received: ${path}`);
          if (!path) return;
          // Strip any remaining file:// prefix (safety net)
          if (path.startsWith("file:///")) {
            path = decodeURIComponent(path.slice(8)).replace(/\//g, "\\");
          } else if (path.startsWith("file://")) {
            path = decodeURIComponent(path.slice(7)).replace(/\//g, "\\");
          }
          // Show and focus window
          getCurrentWebviewWindow().show().catch(() => {});
          getCurrentWebviewWindow().setFocus().catch(() => {});
          try {
            const info = await stat(path);
            if (info.isDirectory) {
              console.log(`[rune] open-path: opening folder ${path}`);
              await fs.openFolderByPath(path);
            } else {
              // File: open its parent dir as workspace, then open file as tab
              const sep = path.includes("\\") ? "\\" : "/";
              const lastSep = path.lastIndexOf(sep);
              const parentDir = lastSep > 0 ? path.substring(0, lastSep) : null;
              const name = path.substring(lastSep + 1);

              console.log(`[rune] open-path: file ${path}, parent: ${parentDir}`);

              // Open parent as workspace if it's different from current
              if (parentDir && parentDir !== fs.rootPath()) {
                await fs.openFolderByPath(parentDir);
                // Wait for workspace to load
                await new Promise(r => setTimeout(r, 300));
              }

              await handleFileClick({ path, name });
            }
          } catch (err) {
            console.error("open-path: failed to open", path, err);
          }
        });
      } catch (e) {
        console.error("open-path: listener setup failed", e);
      }
    })();
  });

  createEffect(() => {
    document.documentElement.style.setProperty("--editor-font-size", `${globalSettings.editorFontSize}px`);
    document.documentElement.style.setProperty("--terminal-font-size", `${globalSettings.terminalFontSize}px`);
    document.documentElement.style.setProperty("--editor-font-family", globalSettings.editorFontFamily);
  });

  let workspaceReady = false;

  createEffect(() => {
    workspaceSettings.excludeItems;
    if (fs.rootPath() && workspaceReady) {
      console.log(`[rune] excludeItems changed → refreshTree`);
      fs.refreshTree();
    }
  });

  createEffect(() => {
    const root = fs.rootPath();
    if (root === previousRoot) return;

    if (previousRoot) {
      tabStore.saveTabsToStorage(previousRoot);
    }

    tabStore.clearAll();
    previousRoot = root;

    if (root) {
      console.log(`[rune] workspace effect: ${root}`);

      // Settings already loaded by loadAllSettings — just mark ready
      workspaceReady = true;

      const stored = tabStore.loadTabsFromStorage(root);
      if (stored) {
        const tabT0 = performance.now();
        const activePath = tabStore.getStoredActiveFilePath(root);
        const rightActivePath = tabStore.getStoredRightActiveFilePath(root);
        (async () => {
          console.log(`[rune] restoring ${stored.length} tabs...`);
          const results = await Promise.allSettled(
            stored.map(async (t) => {
              const { content, language, fileType } = await fs.readFileContent(t.filePath);
              const dataUrl = fileType === "image" || fileType === "pdf" ? content : undefined;
              const tabContent = fileType === "image" || fileType === "pdf" ? "" : content;
              return { ...t, content: tabContent, language, fileType, dataUrl };
            })
          );
          for (const result of results) {
            if (result.status === "fulfilled") {
              const t = result.value;
              tabStore.openTab(t.filePath, t.fileName, t.content, t.language, t.fileType, t.dataUrl, t.pane);
            }
          }
          console.log(`[rune] tabs restored: ${Math.round(performance.now() - tabT0)}ms`);
          if (activePath) {
            const match = tabStore.tabs().find((t) => t.filePath === activePath);
            if (match) tabStore.setActiveTabForPane(match.id, "left");
          }
          if (rightActivePath) {
            const match = tabStore.tabs().find((t) => t.filePath === rightActivePath);
            if (match) {
              tabStore.setActiveTabForPane(match.id, "right");
              settingsStore.setSplitActive(true);
            }
          }
        })();
      }
    }
  });

  function showContextMenu(x: number, y: number, items: ContextMenuItem[]) {
    setCtxMenu({ x, y, items });
  }

  function confirmDelete(name: string, onConfirm: () => void) {
    setConfirmState({
      message: `Delete "${name}"?`,
      detail: "This action cannot be undone.",
      onConfirm,
    });
  }

  async function deleteSelectedPaths(skipConfirm = false) {
    const paths = selectedPaths();
    if (paths.size === 0) return;

    const doDelete = async () => {
      for (const path of paths) {
        await fs.deleteFile(path);
        tabStore.closeTabsForPath(path);
      }
      setSelectedPaths(new Set<string>());
    };

    if (paths.size === 1) {
      const path = [...paths][0]!;
      const name = path.split(/[\\/]/).pop() ?? "";
      if (skipConfirm) { await doDelete(); }
      else { confirmDelete(name, doDelete); }
    } else {
      if (skipConfirm) { await doDelete(); }
      else { confirmDelete(`${paths.size} items`, doDelete); }
    }
  }

  async function handleFileClick(entry: { path: string; name: string }, pane: PaneSide = "left") {
    try {
      const { content, language, fileType } = await fs.readFileContent(entry.path);
      const dataUrl = fileType === "image" || fileType === "pdf" ? content : undefined;
      const tabContent = fileType === "image" || fileType === "pdf" ? "" : content;
      tabStore.openTab(entry.path, entry.name, tabContent, language, fileType, dataUrl, pane);
    } catch (err) {
      console.error("Failed to open file:", err);
    }
  }

  function handleEditorChange(content: string, tabId: string) {
    tabStore.updateTabContent(tabId, content);
  }

  async function handleSave() {
    const tab = tabStore.getFocusedTab();
    if (!tab || !tab.isDirty) return;

    if (!tab.filePath || tab.filePath.startsWith("rune://")) {
      await handleSaveAs();
      return;
    }

    try {
      await fs.writeFileContent(tab.filePath, tab.content);
      tabStore.markTabClean(tab.id);
    } catch (err) {
      console.error("Failed to save file:", err);
    }
  }

  async function handleSaveAll() {
    const dirtyTabs = tabStore.tabs().filter((t) => t.isDirty && t.filePath && !t.filePath.startsWith("rune://"));
    for (const tab of dirtyTabs) {
      try {
        await fs.writeFileContent(tab.filePath, tab.content);
        tabStore.markTabClean(tab.id);
      } catch (err) {
        console.error("Failed to save:", tab.fileName, err);
      }
    }
  }

  async function handleSaveAs() {
    const tab = tabStore.getFocusedTab();
    if (!tab) return;

    const { save } = await import("@tauri-apps/plugin-dialog");
    const path = await save({
      defaultPath: tab.filePath || undefined,
      title: "Save As",
    });
    if (!path || typeof path !== "string") return;

    const name = path.split(/[\\/]/).pop() ?? "Untitled";
    try {
      await fs.writeFileContent(path, tab.content);
      tabStore.updateTabAfterSave(tab.id, path, name);
    } catch (err) {
      console.error("Failed to save file:", err);
    }
  }

  function handleCloseTab() {
    const tab = tabStore.getFocusedTab();
    if (tab) {
      const result = tabStore.closeTab(tab.id);
      if (result.paneCleared) {
        settingsStore.setSplitActive(false);
      }
    }
  }

  function triggerEditorCommand(key: string, code: string) {
    const paneClass = tabStore.focusedPane() === "right" ? ".pane-right" : ".pane-left";
    const paneEl = document.querySelector(paneClass);
    const editorEl = paneEl?.querySelector(".cm-content");
    
    if (editorEl) {
      (editorEl as HTMLElement).focus();
      const event = new KeyboardEvent("keydown", {
        key: key,
        code: code,
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      editorEl.dispatchEvent(event);
    } else {
      const fallbackEl = document.querySelector(".cm-content");
      if (fallbackEl) {
        (fallbackEl as HTMLElement).focus();
        const event = new KeyboardEvent("keydown", {
          key: key,
          code: code,
          ctrlKey: true,
          bubbles: true,
          cancelable: true,
        });
        fallbackEl.dispatchEvent(event);
      }
    }
  }

  const menuActions = {
    openFolder: () => fs.openFolder(),
    save: handleSave,
    saveAll: handleSaveAll,
    saveAs: handleSaveAs,
    toggleTerminal: () => setShowTerminal((prev) => !prev),
    closeTab: handleCloseTab,
    closeAllTabs: () => { tabStore.closeAllTabs(); settingsStore.setSplitActive(false); },
    newFile: () => tabStore.openUntitledTab(),
    newWindow: async () => {
      const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
      const url = window.location.origin + window.location.pathname + "?fresh=1";
      const win = new WebviewWindow(`rune-${Date.now()}`, {
        url,
        title: "Rune Editor",
        width: 1280,
        height: 800,
        decorations: false,
        visible: false,
      });
      win.once("tauri://created", () => {});
      win.once("tauri://error", (e) => console.error("Window error:", e));
    },
    closeWindow: async () => {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      getCurrentWindow().close();
    },
    toggleSidebar: () => settingsStore.toggleSidebar(),
    zoomIn: () => settingsStore.zoomIn(),
    zoomOut: () => settingsStore.zoomOut(),
    zoomReset: () => settingsStore.zoomReset(),
    commandPalette: () => setShowCommandPalette(true),
    workspaceSearch: () => setShowWorkspaceSearch(true),
    find: () => triggerEditorCommand("f", "KeyF"),
    replace: () => triggerEditorCommand("h", "KeyH"),
    about: () => {
      console.log("Menu action: about clicked!");
      const id = tabStore.openTab(
        "rune://about",
        "About Rune.md",
        ABOUT_RUNE_MARKDOWN,
        "markdown",
        "markdown"
      );
      console.log("Opened about tab with ID:", id);
    },
  };

  const { menus } = useMenuDefinitions(menuActions);

  const commands = (): CommandItem[] => [
    { id: "file.new-file", label: "New File", shortcut: "Ctrl+N", category: "File", action: () => tabStore.openUntitledTab() },
    { id: "file.open-folder", label: "Open Folder", shortcut: "Ctrl+K Ctrl+O", category: "File", action: () => fs.openFolder() },
    { id: "file.save", label: "Save", shortcut: "Ctrl+S", category: "File", action: handleSave },
    { id: "file.save-all", label: "Save All", shortcut: "Ctrl+Alt+S", category: "File", action: handleSaveAll },
    { id: "file.save-as", label: "Save As", shortcut: "Ctrl+Shift+S", category: "File", action: handleSaveAs },
    { id: "file.close-tab", label: "Close Tab", shortcut: "Ctrl+W", category: "File", action: handleCloseTab },
    { id: "file.close-all", label: "Close All Tabs", category: "File", action: () => { tabStore.closeAllTabs(); settingsStore.setSplitActive(false); } },
    { id: "file.new-window", label: "New Window", shortcut: "Ctrl+Shift+N", category: "File", action: menuActions.newWindow },
    { id: "file.close-window", label: "Close Window", shortcut: "Ctrl+Shift+W", category: "File", action: menuActions.closeWindow },
    { id: "view.toggle-sidebar", label: "Toggle Sidebar", shortcut: "Ctrl+B", category: "View", action: () => settingsStore.toggleSidebar() },
    { id: "view.zoom-in", label: "Zoom In", shortcut: "Ctrl+=", category: "View", action: () => settingsStore.zoomIn() },
    { id: "view.zoom-out", label: "Zoom Out", shortcut: "Ctrl+-", category: "View", action: () => settingsStore.zoomOut() },
    { id: "view.zoom-reset", label: "Reset Zoom", shortcut: "Ctrl+0", category: "View", action: () => settingsStore.zoomReset() },
    { id: "search.workspace", label: "Find in Workspace", shortcut: "Ctrl+Shift+F", category: "Search", action: () => setShowWorkspaceSearch(true) },
  ];

  useKeyboardShortcuts(
    () => ({
      "ctrl+KeyS": handleSave,
      "ctrl+alt+KeyS": handleSaveAll,
      "ctrl+shift+KeyS": handleSaveAs,
      "ctrl+KeyW": handleCloseTab,
      "ctrl+KeyB": () => settingsStore.toggleSidebar(),
      "ctrl+shift+KeyP": () => setShowCommandPalette(true),
      "ctrl+shift+KeyF": () => setShowWorkspaceSearch(true),
      "ctrl+Equal": () => settingsStore.zoomIn(),
      "ctrl+Minus": () => settingsStore.zoomOut(),
      "ctrl+Digit0": () => settingsStore.zoomReset(),
      "ctrl+KeyN": () => tabStore.openUntitledTab(),
      "ctrl+shift+KeyN": menuActions.newWindow,
      "ctrl+shift+KeyW": menuActions.closeWindow,
      "ctrl+Backquote": () => setShowTerminal((prev) => !prev),
      // Ctrl+Tab / Ctrl+Shift+Tab navigation
      "ctrl+Tab": () => {
        const pane = tabStore.focusedPane();
        const paneTabs = pane === "right" ? tabStore.rightTabs() : tabStore.leftTabs();
        if (paneTabs.length < 2) return;
        const activeId = pane === "right" ? tabStore.rightActiveTabId() : tabStore.activeTabId();
        const idx = paneTabs.findIndex((t) => t.id === activeId);
        const next = paneTabs[(idx + 1) % paneTabs.length]!;
        tabStore.setActiveTabForPane(next.id, pane);
      },
      "ctrl+shift+Tab": () => {
        const pane = tabStore.focusedPane();
        const paneTabs = pane === "right" ? tabStore.rightTabs() : tabStore.leftTabs();
        if (paneTabs.length < 2) return;
        const activeId = pane === "right" ? tabStore.rightActiveTabId() : tabStore.activeTabId();
        const idx = paneTabs.findIndex((t) => t.id === activeId);
        const prev = paneTabs[(idx - 1 + paneTabs.length) % paneTabs.length]!;
        tabStore.setActiveTabForPane(prev.id, pane);
      },
      // Block browser defaults
      "ctrl+KeyP": () => {},
      "ctrl+KeyR": () => {},
      // Delete selected file/folder in explorer
      "Delete": () => deleteSelectedPaths(false),
      "shift+Delete": () => deleteSelectedPaths(true),
    }),
    () => [
      {
        first: ["ctrl+KeyK"],
        second: ["ctrl+KeyO"],
        action: () => fs.openFolder(),
      },
    ],
  );

  const windowTitle = () => {
    const tab = tabStore.getFocusedTab();
    if (tab) {
      return `${tab.isDirty ? "● " : ""}${tab.fileName} — Rune Editor`;
    }
    return "Rune Editor";
  };

  function handleTabContextMenu(tabId: string, pane: PaneSide, e: MouseEvent) {
    const items: ContextMenuItem[] = [
      { label: "Close", action: () => {
        const result = tabStore.closeTab(tabId);
        if (result.paneCleared) settingsStore.setSplitActive(false);
      }},
      { label: "Close Others", action: () => tabStore.closeOtherTabs(tabId) },
      { label: "Close to the Right", action: () => tabStore.closeTabsToRight(tabId) },
      { separator: true, label: "" },
    ];

    if (pane === "left" && !settingsStore.splitActive()) {
      items.push({ label: "Move to Right Pane", action: () => {
        settingsStore.setSplitActive(true);
        tabStore.moveTabToPane(tabId, "right");
      }});
    } else if (pane === "right") {
      items.push({ label: "Move to Left Pane", action: () => {
        tabStore.moveTabToPane(tabId, "left");
        if (!tabStore.rightTabs().length) settingsStore.setSplitActive(false);
      }});
    } else if (pane === "left" && settingsStore.splitActive()) {
      items.push({ label: "Move to Right Pane", action: () => {
        tabStore.moveTabToPane(tabId, "right");
      }});
    }

    items.push(
      { separator: true, label: "" },
      { label: "Close All", action: () => { tabStore.closeAllTabs(); settingsStore.setSplitActive(false); } },
    );
    showContextMenu(e.clientX, e.clientY, items);
  }

  async function revealInExplorer(path: string) {
    const { revealItemInDir } = await import("@tauri-apps/plugin-opener");
    await revealItemInDir(path);
  }

  function getRelativePath(absolutePath: string): string {
    const root = fs.rootPath();
    if (!root) return absolutePath;
    const normPath = absolutePath.replace(/\\/g, "/");
    const normRoot = root.replace(/\\/g, "/").replace(/\/$/, "");
    if (normPath.startsWith(normRoot + "/")) {
      return normPath.slice(normRoot.length + 1);
    }
    return absolutePath;
  }

  function handleFileTreeContextMenu(entry: FileEntry, e: MouseEvent) {
    // If right-clicking an unselected entry, select just that one
    if (!selectedPaths().has(entry.path)) {
      setSelectedPaths(new Set([entry.path]));
    }
    const multi = selectedPaths().size > 1;
    const items: ContextMenuItem[] = [];

    if (multi) {
      items.push(
        { label: `Delete ${selectedPaths().size} Items`, action: () => deleteSelectedPaths() },
      );
    } else if (entry.isDirectory) {
      items.push(
        { label: "New File", action: () => {
          fs.ensureExpanded(entry.path).then(() => setEditingItem({ parentPath: entry.path, mode: "new-file" }));
        }},
        { label: "New Folder", action: () => {
          fs.ensureExpanded(entry.path).then(() => setEditingItem({ parentPath: entry.path, mode: "new-folder" }));
        }},
        { separator: true, label: "" },
        { label: "Copy Path", action: () => navigator.clipboard.writeText(entry.path) },
        { label: "Copy Relative Path", action: () => navigator.clipboard.writeText(getRelativePath(entry.path)) },
        { label: "Reveal in Explorer", action: () => revealInExplorer(entry.path) },
        { separator: true, label: "" },
        { label: "Rename", action: () => setEditingItem({ parentPath: entry.path, mode: "rename" }) },
        { label: "Delete", action: () => deleteSelectedPaths() },
        { separator: true, label: "" },
        { label: "Collapse All", action: () => fs.collapseAll() },
      );
    } else {
      items.push(
        { label: "Open", action: () => handleFileClick(entry) },
        { separator: true, label: "" },
        { label: "Copy Path", action: () => navigator.clipboard.writeText(entry.path) },
        { label: "Copy Relative Path", action: () => navigator.clipboard.writeText(getRelativePath(entry.path)) },
        { label: "Reveal in Explorer", action: () => revealInExplorer(entry.path) },
        { separator: true, label: "" },
        { label: "Rename", action: () => setEditingItem({ parentPath: entry.path, mode: "rename" }) },
        { label: "Delete", action: () => deleteSelectedPaths() },
      );
    }
    showContextMenu(e.clientX, e.clientY, items);
  }

  function handleEmptyContextMenu(e: MouseEvent) {
    const root = fs.rootPath();
    if (!root) return;
    const items: ContextMenuItem[] = [
      { label: "New File", action: () => setEditingItem({ parentPath: root, mode: "new-file" }) },
      { label: "New Folder", action: () => setEditingItem({ parentPath: root, mode: "new-folder" }) },
    ];
    showContextMenu(e.clientX, e.clientY, items);
  }

  async function handleSubmitEdit(parentPath: string, name: string, mode: EditingMode, originalName?: string) {
    if (mode === "new-file") {
      await fs.createNewFile(parentPath, name);
    } else if (mode === "new-folder") {
      await fs.createNewFolder(parentPath, name);
    } else if (mode === "rename" && originalName) {
      const entry = findEntryByPath(parentPath);
      if (entry) await fs.renameEntry(entry.path, name);
    }
    // Always clear the inline input after any edit action
    setEditingItem(null);
  }

  function findEntryByPath(path: string): FileEntry | undefined {
    function search(entries: FileEntry[]): FileEntry | undefined {
      for (const e of entries) {
        if (e.path === path) return e;
        if (e.children) {
          const found = search(e.children);
          if (found) return found;
        }
      }
      return undefined;
    }
    return search(fs.tree());
  }

  async function handleSearchResultClick(filePath: string) {
    const name = filePath.split(/[\\/]/).pop() ?? "";
    await handleFileClick({ path: filePath, name });
  }

  async function handleRunScript() {
    const root = fs.rootPath();
    if (!root) return;

    setShowTerminal(true);

    const separator = root.includes('\\') ? '\\' : '/';
    const settingsFolder = root + separator + ".rune";
    const settingsPath = settingsFolder + separator + "settings.json";

    try {
      const { content } = await fs.readFileContent(settingsPath);
      const config = JSON.parse(content);
      const runCommand = config.run || config.runScript;
      if (runCommand) {
        // Allow time for terminal panel to mount if it was just opened
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("rune-run-script", { detail: runCommand }));
        }, 100);
      } else {
        alert("No 'run' command found in .rune/settings.json");
      }
    } catch {
      try {
        await fs.createNewFolder(root, ".rune");
      } catch {}
      const defaultSettings = `{
  "run": "echo 'Hello from Rune!'"
}`;
      await fs.writeFileContent(settingsPath, defaultSettings);
      await handleFileClick({ path: settingsPath, name: "settings.json" });
      alert("Created .rune/settings.json. Please edit the 'run' command and click Play/Run again.");
    }
  }

  async function handleOpenSettings() {
    tabStore.openTab(
      "rune://settings",
      "Settings",
      "",
      "settings",
      "settings"
    );
  }

  function handleRefreshTree() {
    fs.refreshTree();
  }

  const leftActiveTab = () => tabStore.getActiveTab();
  const rightActiveTab = () => tabStore.getRightActiveTab();

  return (
    <div
      class="h-screen w-screen flex flex-col overflow-hidden"
      style={{ background: "var(--color-bg)", color: "var(--color-fg)" }}
      onContextMenu={(e) => {
        e.preventDefault();
      }}
    >
      <Titlebar menus={menus()} title={windowTitle()} />
      <Show
        when={fs.rootPath() || tabStore.leftTabs().length > 0 || tabStore.rightTabs().length > 0}
        fallback={
          <div class="flex-1 flex flex-col items-center justify-center p-8 md:p-12 overflow-y-auto" style={{ background: "var(--color-bg)" }}>
            <div class="max-w-[760px] w-full flex flex-col gap-12 my-auto">
              
              {/* Header */}
              <div class="flex flex-col items-center text-center">
                <img src="/logo.svg" alt="Rune Logo" class="w-16 h-16 mb-4 select-none pointer-events-none rounded-2xl" 
                     style={{ "box-shadow": "0 0 20px var(--color-border)" }} />
                <h1 class="text-3xl font-light tracking-[0.3em] uppercase text-[var(--color-fg)]">
                  Rune
                </h1>
                <p class="text-sm font-light tracking-wide mt-2 text-[var(--color-fg-muted)]">
                  A lightweight, lightning-fast code editor
                </p>
              </div>

              {/* Main Content Grid */}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                
                {/* Left Column - Actions */}
                <div class="flex flex-col gap-3">
                  <h2 class="text-xs uppercase tracking-[0.2em] font-semibold text-[var(--color-fg-muted)] mb-1">
                    Start
                  </h2>
                  
                  {/* New File Button */}
                  <button
                    class="w-full text-left p-4 rounded-lg transition-all flex items-center gap-4 group cursor-pointer"
                    style={{
                      border: "1px solid var(--color-border)",
                      background: "var(--color-bg-secondary)"
                    }}
                    onMouseEnter={(e) => {
                      const t = e.currentTarget as HTMLElement;
                      t.style.borderColor = "var(--color-accent)";
                      t.style.background = "var(--color-bg-tertiary)";
                    }}
                    onMouseLeave={(e) => {
                      const t = e.currentTarget as HTMLElement;
                      t.style.borderColor = "var(--color-border)";
                      t.style.background = "var(--color-bg-secondary)";
                    }}
                    onClick={() => tabStore.openUntitledTab()}
                  >
                    <div class="p-2 rounded transition-colors" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-[var(--color-fg-muted)] group-hover:text-[var(--color-accent)] transition-colors">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                    </div>
                    <div>
                      <span class="text-sm font-medium text-[var(--color-fg)] transition-colors block" style={{ color: "var(--color-fg)" }}>New File</span>
                      <span class="text-xs text-[var(--color-fg-muted)] mt-0.5 block">Create a new scratchpad file</span>
                    </div>
                    <kbd class="ml-auto text-[10px] px-2 py-1 rounded font-mono" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-fg-muted)" }}>Ctrl+N</kbd>
                  </button>

                  {/* Open Folder Button */}
                  <button
                    class="w-full text-left p-4 rounded-lg transition-all flex items-center gap-4 group cursor-pointer"
                    style={{
                      border: "1px solid var(--color-border)",
                      background: "var(--color-bg-secondary)"
                    }}
                    onMouseEnter={(e) => {
                      const t = e.currentTarget as HTMLElement;
                      t.style.borderColor = "var(--color-accent)";
                      t.style.background = "var(--color-bg-tertiary)";
                    }}
                    onMouseLeave={(e) => {
                      const t = e.currentTarget as HTMLElement;
                      t.style.borderColor = "var(--color-border)";
                      t.style.background = "var(--color-bg-secondary)";
                    }}
                    onClick={() => fs.openFolder()}
                  >
                    <div class="p-2 rounded transition-colors" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-[var(--color-fg-muted)] group-hover:text-[var(--color-accent)] transition-colors">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                      </svg>
                    </div>
                    <div>
                      <span class="text-sm font-medium text-[var(--color-fg)] transition-colors block" style={{ color: "var(--color-fg)" }}>Open Folder</span>
                      <span class="text-xs text-[var(--color-fg-muted)] mt-0.5 block">Open an existing workspace</span>
                    </div>
                    <kbd class="ml-auto text-[10px] px-2 py-1 rounded font-mono" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-fg-muted)" }}>Ctrl+K Ctrl+O</kbd>
                  </button>

                  {/* Command Palette Button */}
                  <button
                    class="w-full text-left p-4 rounded-lg transition-all flex items-center gap-4 group cursor-pointer"
                    style={{
                      border: "1px solid var(--color-border)",
                      background: "var(--color-bg-secondary)"
                    }}
                    onMouseEnter={(e) => {
                      const t = e.currentTarget as HTMLElement;
                      t.style.borderColor = "var(--color-accent)";
                      t.style.background = "var(--color-bg-tertiary)";
                    }}
                    onMouseLeave={(e) => {
                      const t = e.currentTarget as HTMLElement;
                      t.style.borderColor = "var(--color-border)";
                      t.style.background = "var(--color-bg-secondary)";
                    }}
                    onClick={() => setShowCommandPalette(true)}
                  >
                    <div class="p-2 rounded transition-colors" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-[var(--color-fg-muted)] group-hover:text-[var(--color-accent)] transition-colors">
                        <polyline points="4 17 10 11 4 5"/>
                        <line x1="12" y1="19" x2="20" y2="19"/>
                      </svg>
                    </div>
                    <div>
                      <span class="text-sm font-medium text-[var(--color-fg)] transition-colors block" style={{ color: "var(--color-fg)" }}>Command Palette</span>
                      <span class="text-xs text-[var(--color-fg-muted)] mt-0.5 block">Run commands and search tools</span>
                    </div>
                    <kbd class="ml-auto text-[10px] px-2 py-1 rounded font-mono" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-fg-muted)" }}>Ctrl+Shift+P</kbd>
                  </button>
                </div>

                {/* Right Column - Shortcuts */}
                <div class="flex flex-col gap-3">
                  <h2 class="text-xs uppercase tracking-[0.2em] font-semibold text-[var(--color-fg-muted)] mb-1">
                    Keyboard Shortcuts
                  </h2>
                  <div class="rounded-lg p-5 flex flex-col gap-4" style={{ border: "1px solid var(--color-border)", background: "var(--color-bg-secondary)" }}>
                    <div class="flex justify-between items-center text-xs pb-2" style={{ "border-bottom": "1px solid var(--color-border)" }}>
                      <span style={{ color: "var(--color-fg-muted)" }}>New Window</span>
                      <kbd class="px-2 py-0.5 rounded font-mono" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-fg)" }}>Ctrl+Shift+N</kbd>
                    </div>
                    <div class="flex justify-between items-center text-xs pb-2" style={{ "border-bottom": "1px solid var(--color-border)" }}>
                      <span style={{ color: "var(--color-fg-muted)" }}>Save Document</span>
                      <kbd class="px-2 py-0.5 rounded font-mono" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-fg)" }}>Ctrl+S</kbd>
                    </div>
                    <div class="flex justify-between items-center text-xs pb-2" style={{ "border-bottom": "1px solid var(--color-border)" }}>
                      <span style={{ color: "var(--color-fg-muted)" }}>Find in Workspace</span>
                      <kbd class="px-2 py-0.5 rounded font-mono" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-fg)" }}>Ctrl+Shift+F</kbd>
                    </div>
                    <div class="flex justify-between items-center text-xs pb-2" style={{ "border-bottom": "1px solid var(--color-border)" }}>
                      <span style={{ color: "var(--color-fg-muted)" }}>Toggle Sidebar</span>
                      <kbd class="px-2 py-0.5 rounded font-mono" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-fg)" }}>Ctrl+B</kbd>
                    </div>
                    <div class="flex justify-between items-center text-xs">
                      <span style={{ color: "var(--color-fg-muted)" }}>Zoom In / Out</span>
                      <kbd class="px-2 py-0.5 rounded font-mono" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-fg)" }}>Ctrl + / -</kbd>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        }
      >
        <div class="flex flex-1 overflow-hidden">
        {settingsStore.sidebarVisible() && (
          <>
            <FileTree
              tree={fs.tree()}
              rootPath={fs.rootPath()}
              loading={fs.loading()}
              width={settingsStore.sidebarWidth()}
              onFileClick={(entry) => handleFileClick(entry, "left")}
              onToggleDir={fs.toggleDirectory}
              onOpenFolder={() => fs.openFolder()}
              onRefresh={handleRefreshTree}
              onContextMenu={(entry, e) => {
                handleFileTreeContextMenu(entry, e);
              }}
              onEmptyContextMenu={handleEmptyContextMenu}
              activeFilePath={leftActiveTab()?.filePath}
              selectedPaths={selectedPaths()}
              onSelectPaths={setSelectedPaths}
              editingItem={editingItem()}
              onStartEdit={(parentPath, mode) => setEditingItem({ parentPath, mode })}
              onSubmitEdit={handleSubmitEdit}
              onCancelEdit={() => setEditingItem(null)}
              onRunScript={handleRunScript}
              onOpenSettings={handleOpenSettings}
              onToggleTerminal={() => setShowTerminal((prev) => !prev)}
            />
            <div
              class="w-[3px] shrink-0 cursor-col-resize hover:bg-[var(--color-accent)] transition-colors"
              style={{ background: "var(--color-border)" }}
              onMouseDown={(e) => {
                e.preventDefault();
                const startX = e.clientX;
                const startWidth = settingsStore.sidebarWidth();
                function onMove(ev: MouseEvent) {
                  const delta = ev.clientX - startX;
                  settingsStore.setSidebarWidth(Math.max(150, Math.min(500, startWidth + delta)));
                }
                function onUp() {
                  document.removeEventListener("mousemove", onMove);
                  document.removeEventListener("mouseup", onUp);
                }
                document.addEventListener("mousemove", onMove);
                document.addEventListener("mouseup", onUp);
              }}
            />
          </>
        )}
        <div class="flex-1 flex flex-col overflow-hidden">
          <div class="flex-1 flex overflow-hidden">
          {/* Left Pane */}
          <div
            class="flex flex-col overflow-hidden pane-left"
            style={{ width: settingsStore.splitActive() ? `${settingsStore.splitWidth()}%` : "100%" }}
            onMouseDown={() => tabStore.setFocusedPane("left")}
          >
            <TabBar
              tabs={tabStore.leftTabs()}
              activeTabId={tabStore.activeTabId()}
              onTabClick={(id) => tabStore.setActiveTabForPane(id, "left")}
              onTabClose={(id) => {
                const result = tabStore.closeTab(id);
                if (result.paneCleared === "left" && !tabStore.rightTabs().length) {
                  settingsStore.setSplitActive(false);
                }
              }}
              onTabContextMenu={(id, e) => handleTabContextMenu(id, "left", e)}
            />
            <Editor
              content={leftActiveTab()?.content ?? ""}
              language={leftActiveTab()?.language ?? "text"}
              isDirty={leftActiveTab()?.isDirty ?? false}
              hasOpenFile={!!leftActiveTab()}
              onChange={(content) => {
                const tab = leftActiveTab();
                if (tab) handleEditorChange(content, tab.id);
              }}
              tabId={leftActiveTab()?.id ?? null}
              fileType={leftActiveTab()?.fileType ?? "text"}
              dataUrl={leftActiveTab()?.dataUrl}
              fileName={leftActiveTab()?.fileName}
              onCreateFile={() => tabStore.openUntitledTab()}
              onOpenFolder={() => fs.openFolder()}
              onOpenCommandPalette={() => setShowCommandPalette(true)}
              onSearchWorkspace={() => setShowWorkspaceSearch(true)}
            />
          </div>

          {/* Split Divider */}
          <Show when={settingsStore.splitActive()}>
            <div
              class="w-[3px] shrink-0 cursor-col-resize hover:bg-[var(--color-accent)] transition-colors relative group"
              style={{ background: "var(--color-border)" }}
              onMouseDown={(e) => {
                e.preventDefault();
                const parent = (e.currentTarget as HTMLElement).parentElement;
                if (!parent) return;
                const startX = e.clientX;
                const parentWidth = parent.clientWidth;
                const startPct = settingsStore.splitWidth();
                function onMove(ev: MouseEvent) {
                  const delta = ev.clientX - startX;
                  const deltaPct = (delta / parentWidth) * 100;
                  settingsStore.setSplitWidth(Math.max(20, Math.min(80, startPct + deltaPct)));
                }
                function onUp() {
                  document.removeEventListener("mousemove", onMove);
                  document.removeEventListener("mouseup", onUp);
                }
                document.addEventListener("mousemove", onMove);
                document.addEventListener("mouseup", onUp);
              }}
            >
              {/* Close split button */}
              <button
                class="absolute -top-[1px] right-0 w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                style={{
                  background: "var(--color-bg-secondary)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-fg-muted)",
                  cursor: "pointer",
                  "font-size": "10px",
                }}
                onClick={() => {
                  const rightTabs = tabStore.rightTabs();
                  for (const t of rightTabs) {
                    tabStore.moveTabToPane(t.id, "left");
                  }
                  settingsStore.setSplitActive(false);
                }}
                title="Close split"
              >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" stroke-width="1.5">
                  <line x1="1" y1="1" x2="7" y2="7" />
                  <line x1="7" y1="1" x2="1" y2="7" />
                </svg>
              </button>
            </div>
          </Show>

          {/* Right Pane */}
          <Show when={settingsStore.splitActive()}>
            <div
              class="flex flex-col overflow-hidden pane-right"
              style={{ width: `${100 - settingsStore.splitWidth()}%` }}
              onMouseDown={() => tabStore.setFocusedPane("right")}
            >
              <TabBar
                tabs={tabStore.rightTabs()}
                activeTabId={tabStore.rightActiveTabId()}
                onTabClick={(id) => tabStore.setActiveTabForPane(id, "right")}
                onTabClose={(id) => {
                  const result = tabStore.closeTab(id);
                  if (result.paneCleared === "right") {
                    settingsStore.setSplitActive(false);
                  }
                }}
                onTabContextMenu={(id, e) => handleTabContextMenu(id, "right", e)}
              />
              <Editor
                content={rightActiveTab()?.content ?? ""}
                language={rightActiveTab()?.language ?? "text"}
                isDirty={rightActiveTab()?.isDirty ?? false}
                hasOpenFile={!!rightActiveTab()}
                onChange={(content) => {
                  const tab = rightActiveTab();
                  if (tab) handleEditorChange(content, tab.id);
                }}
                tabId={rightActiveTab()?.id ?? null}
                fileType={rightActiveTab()?.fileType ?? "text"}
                dataUrl={rightActiveTab()?.dataUrl}
                fileName={rightActiveTab()?.fileName}
                onCreateFile={() => tabStore.openUntitledTab()}
                onOpenFolder={() => fs.openFolder()}
                onOpenCommandPalette={() => setShowCommandPalette(true)}
                onSearchWorkspace={() => setShowWorkspaceSearch(true)}
              />
            </div>
          </Show>
          </div>
          <Show when={showTerminal()}>
            <div
              class="w-full h-[3px] shrink-0 cursor-row-resize hover:bg-[var(--color-accent)] transition-colors relative z-10"
              style={{ background: "var(--color-border)" }}
              onMouseDown={(e) => {
                e.preventDefault();
                const startY = e.clientY;
                const startHeight = terminalHeight();
                function onMove(ev: MouseEvent) {
                  const delta = startY - ev.clientY;
                  const newHeight = Math.max(100, Math.min(window.innerHeight * 0.8, startHeight + delta));
                  setTerminalHeight(newHeight);
                }
                function onUp() {
                  document.removeEventListener("mousemove", onMove);
                  document.removeEventListener("mouseup", onUp);
                }
                document.addEventListener("mousemove", onMove);
                document.addEventListener("mouseup", onUp);
              }}
            />
            <div style={{ height: `${terminalHeight()}px` }} class="flex flex-col shrink-0 overflow-hidden">
              <TerminalPanel onClose={() => setShowTerminal(false)} rootPath={fs.rootPath()} />
            </div>
          </Show>
        </div>
      </div>
      </Show>
      {ctxMenu() && (
        <ContextMenu
          x={ctxMenu()!.x}
          y={ctxMenu()!.y}
          items={ctxMenu()!.items}
          onClose={() => setCtxMenu(null)}
        />
      )}
      {showCommandPalette() && (
        <CommandPalette
          commands={commands()}
          onClose={() => setShowCommandPalette(false)}
        />
      )}
      {showWorkspaceSearch() && (
        <WorkspaceSearch
          rootPath={fs.rootPath()}
          onClose={() => setShowWorkspaceSearch(false)}
          onResultClick={handleSearchResultClick}
        />
      )}
      {confirmState() && (
        <ConfirmDialog
          message={confirmState()!.message}
          detail={confirmState()!.detail}
          onConfirm={() => {
            confirmState()!.onConfirm();
            setConfirmState(null);
          }}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </div>
  );
}
