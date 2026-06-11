import { tabStore } from "@/stores/tabs";
import { settingsStore } from "@/stores/settings";
import { pluginRegistry } from "@/plugins";
import { useMenuDefinitions } from "./useMenuDefinitions";
import {
  useKeyboardShortcuts,
  normalizeShortcut,
} from "./useKeyboardShortcuts";
import { ABOUT_RUNE_MARKDOWN } from "@/constants/about";
import type { CommandItem } from "@/types";

interface AppCommandsOptions {
  fs: any;
  handleSave: () => Promise<void>;
  handleSaveAll: () => Promise<void>;
  handleSaveAs: () => Promise<void>;
  handleCloseTab: () => void;
  setShowTerminal: (show: boolean | ((prev: boolean) => boolean)) => void;
  setShowCommandPalette: (show: boolean) => void;
  setShowWorkspaceSearch: (show: boolean) => void;
  deleteSelectedPaths: (skipConfirm?: boolean) => Promise<void>;
  triggerEditorCommand: (key: string) => void;
  openPaletteWithPrefix?: (prefix: string) => void;
}

export function useAppCommands(options: AppCommandsOptions) {
  const {
    fs,
    handleSave,
    handleSaveAll,
    handleSaveAs,
    handleCloseTab,
    setShowTerminal,
    setShowCommandPalette,
    setShowWorkspaceSearch,
    deleteSelectedPaths,
    triggerEditorCommand,
  } = options;

  const menuActions = {
    openFolder: () => fs.openFolder(),
    refresh: () => fs.refreshTree(),
    save: handleSave,
    saveAll: handleSaveAll,
    saveAs: handleSaveAs,
    toggleTerminal: () => setShowTerminal((prev: boolean) => !prev),
    closeTab: handleCloseTab,
    closeAllTabs: () => {
      tabStore.closeAllTabs();
      settingsStore.setSplitActive(false);
    },
    newFile: () => tabStore.openUntitledTab(),
    newWindow: async () => {
      const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
      const url =
        window.location.origin + window.location.pathname + "?fresh=1";
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
    find: () => triggerEditorCommand("f"),
    replace: () => triggerEditorCommand("h"),
    about: () => {
      tabStore.openTab(
        "rune://about",
        "About Rune.md",
        ABOUT_RUNE_MARKDOWN,
        "markdown",
        "markdown",
      );
    },
  };

  const { menus } = useMenuDefinitions(menuActions);

  const commands = (): CommandItem[] => [
    {
      id: "file.new-file",
      label: "New File",
      shortcut: "Ctrl+N",
      category: "File",
      action: () => tabStore.openUntitledTab(),
    },
    {
      id: "file.open-folder",
      label: "Open Folder",
      shortcut: "Ctrl+K Ctrl+O",
      category: "File",
      action: () => fs.openFolder(),
    },
    {
      id: "file.save",
      label: "Save",
      shortcut: "Ctrl+S",
      category: "File",
      action: handleSave,
    },
    {
      id: "file.save-all",
      label: "Save All",
      shortcut: "Ctrl+Alt+S",
      category: "File",
      action: handleSaveAll,
    },
    {
      id: "file.save-as",
      label: "Save As",
      shortcut: "Ctrl+Shift+S",
      category: "File",
      action: handleSaveAs,
    },
    {
      id: "file.close-tab",
      label: "Close Tab",
      shortcut: "Ctrl+W",
      category: "File",
      action: handleCloseTab,
    },
    {
      id: "file.close-all",
      label: "Close All Tabs",
      category: "File",
      action: () => {
        tabStore.closeAllTabs();
        settingsStore.setSplitActive(false);
      },
    },
    {
      id: "file.new-window",
      label: "New Window",
      shortcut: "Ctrl+Shift+N",
      category: "File",
      action: menuActions.newWindow,
    },
    {
      id: "file.close-window",
      label: "Close Window",
      shortcut: "Ctrl+Shift+W",
      category: "File",
      action: menuActions.closeWindow,
    },
    {
      id: "view.toggle-sidebar",
      label: "Toggle Sidebar",
      shortcut: "Ctrl+B",
      category: "View",
      action: () => settingsStore.toggleSidebar(),
    },
    {
      id: "view.zoom-in",
      label: "Zoom In",
      shortcut: "Ctrl+=",
      category: "View",
      action: () => settingsStore.zoomIn(),
    },
    {
      id: "view.zoom-out",
      label: "Zoom Out",
      shortcut: "Ctrl+-",
      category: "View",
      action: () => settingsStore.zoomOut(),
    },
    {
      id: "view.zoom-reset",
      label: "Reset Zoom",
      shortcut: "Ctrl+0",
      category: "View",
      action: () => settingsStore.zoomReset(),
    },
    ...pluginRegistry.getCommands(),
  ];

  useKeyboardShortcuts(
    () => {
      const map: Record<string, () => void> = {
        "ctrl+KeyS": handleSave,
        "ctrl+alt+KeyS": handleSaveAll,
        "ctrl+shift+KeyS": handleSaveAs,
        "ctrl+KeyW": handleCloseTab,
        "ctrl+KeyB": () => settingsStore.toggleSidebar(),
        "ctrl+Equal": () => settingsStore.zoomIn(),
        "ctrl+Minus": () => settingsStore.zoomOut(),
        "ctrl+Digit0": () => settingsStore.zoomReset(),
        "ctrl+KeyN": () => tabStore.openUntitledTab(),
        "ctrl+shift+KeyN": menuActions.newWindow,
        "ctrl+shift+KeyW": menuActions.closeWindow,
        // Ctrl+Tab / Ctrl+Shift+Tab navigation
        "ctrl+Tab": () => {
          const pane = tabStore.focusedPane();
          const paneTabs =
            pane === "right" ? tabStore.rightTabs() : tabStore.leftTabs();
          if (paneTabs.length < 2) return;
          const activeId =
            pane === "right"
              ? tabStore.rightActiveTabId()
              : tabStore.activeTabId();
          const idx = paneTabs.findIndex((t) => t.id === activeId);
          const next = paneTabs[(idx + 1) % paneTabs.length]!;
          tabStore.setActiveTabForPane(next.id, pane);
        },
        "ctrl+shift+Tab": () => {
          const pane = tabStore.focusedPane();
          const paneTabs =
            pane === "right" ? tabStore.rightTabs() : tabStore.leftTabs();
          if (paneTabs.length < 2) return;
          const activeId =
            pane === "right"
              ? tabStore.rightActiveTabId()
              : tabStore.activeTabId();
          const idx = paneTabs.findIndex((t) => t.id === activeId);
          const prev = paneTabs[(idx - 1 + paneTabs.length) % paneTabs.length]!;
          tabStore.setActiveTabForPane(prev.id, pane);
        },
        // Ctrl+P opens file search palette
        "ctrl+KeyP": () => {
          if (options.openPaletteWithPrefix) {
            options.openPaletteWithPrefix("");
          }
        },
        "ctrl+KeyF": menuActions.find,
        "ctrl+KeyH": menuActions.replace,
        "ctrl+KeyR": () => {},
        // Delete selected file/folder in explorer
        Delete: () => deleteSelectedPaths(false),
        "shift+Delete": () => deleteSelectedPaths(true),
      };

      // Merge dynamic shortcuts from plugin commands
      for (const cmd of pluginRegistry.getCommands()) {
        if (cmd.shortcut) {
          const combo = normalizeShortcut(cmd.shortcut);
          if (combo) {
            map[combo] = cmd.action;
          }
        }
      }

      return map;
    },
    () => [
      {
        first: ["ctrl+KeyK"],
        second: ["ctrl+KeyO"],
        action: () => fs.openFolder(),
      },
    ],
  );

  return { menus, commands };
}
