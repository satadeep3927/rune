import { createSignal, createEffect, onMount, onCleanup } from "solid-js";
import { useFileSystem } from "@/hooks/useFileSystem";
import { useAppStartup } from "@/hooks/useAppStartup";
import { useWorkspaceSync } from "@/hooks/useWorkspaceSync";
import { useEditorActions } from "@/hooks/useEditorActions";
import { useExplorerActions } from "@/hooks/useExplorerActions";
import { useTabContextMenu } from "@/hooks/useTabContextMenu";
import { useAppCommands } from "@/hooks/useAppCommands";
import { useFileClipboard } from "@/hooks/useFileClipboard";

import { globalSettings, settingsStore } from "@/stores/settings";
import { tabStore } from "@/stores/tabs";
import type { EditingMode } from "@/features/file-tree/FileTreeNode";
import type { ContextMenuItem } from "@/components/ContextMenu";

export function useMainLayout() {
  const fs = useFileSystem();

  // Local State
  const [ctxMenu, setCtxMenu] = createSignal<{
    x: number;
    y: number;
    items: ContextMenuItem[];
  } | null>(null);
  const [showCommandPalette, setShowCommandPalette] = createSignal(false);
  const [palettePrefix, setPalettePrefix] = createSignal("");
  const [showWorkspaceSearch, setShowWorkspaceSearch] = createSignal(false);
  const [showTerminal, setShowTerminal] = createSignal(false);
  const [terminalHeight, setTerminalHeight] = createSignal(240);
  const [editingItem, setEditingItem] = createSignal<{
    parentPath: string;
    mode: EditingMode;
  } | null>(null);
  const [confirmState, setConfirmState] = createSignal<{
    message: string;
    detail?: string;
    okLabel?: string;
    cancelLabel?: string;
    variant?: "primary" | "danger";
    hideCancel?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
  } | null>(null);
  const [quickPickState, setQuickPickState] = createSignal<{
    items: { id: string; label: string; detail?: string }[];
    placeholder?: string;
    onSelect: (id: string | undefined) => void;
  } | null>(null);
  const [selectedPaths, setSelectedPaths] = createSignal<Set<string>>(
    new Set(),
  );

  createEffect(() => {
    fs.setWatchingPaused(!!editingItem());
  });

  function showContextMenu(x: number, y: number, items: ContextMenuItem[]) {
    setCtxMenu({ x, y, items });
  }

  function showConfirmDialog(
    message: string,
    options?: {
      detail?: string;
      okLabel?: string;
      cancelLabel?: string;
      variant?: "primary" | "danger";
      hideCancel?: boolean;
    },
  ): Promise<boolean> {
    return new Promise((resolve) => {
      setConfirmState({
        message,
        detail: options?.detail,
        okLabel: options?.okLabel,
        cancelLabel: options?.cancelLabel,
        variant: options?.variant,
        hideCancel: options?.hideCancel,
        onConfirm: () => {
          setConfirmState(null);
          resolve(true);
        },
        onCancel: () => {
          setConfirmState(null);
          resolve(false);
        },
      });
    });
  }

  function showQuickPick(
    items: { id: string; label: string; detail?: string }[],
    options?: { placeholder?: string },
  ): Promise<string | undefined> {
    return new Promise((resolve) => {
      setQuickPickState({
        items,
        placeholder: options?.placeholder,
        onSelect: (id) => {
          setQuickPickState(null);
          resolve(id);
        },
      });
    });
  }

  function confirmDelete(name: string, onConfirm: () => void) {
    showConfirmDialog(`Delete "${name}"?`, {
      detail: "This action cannot be undone.",
      okLabel: "Delete",
      cancelLabel: "Cancel",
      variant: "danger",
    }).then((confirmed) => {
      if (confirmed) {
        onConfirm();
      }
    });
  }

  function handleEditorChange(content: string, tabId: string) {
    tabStore.updateTabContent(tabId, content);
  }

  const fileClipboard = useFileClipboard(fs);

  // Hooks Initialization
  const {
    deleteSelectedPaths,
    handleFileClick,
    handleFileTreeContextMenu,
    handleEmptyContextMenu,
    handleSubmitEdit,
  } = useExplorerActions({
    fs,
    selectedPaths,
    setSelectedPaths,
    setEditingItem,
    showContextMenu,
    confirmDelete,
    fileClipboard,
  });

  useAppStartup({
    fs,
    toggleTerminal: () => setShowTerminal((prev) => !prev),
    toggleWorkspaceSearch: () => setShowWorkspaceSearch((prev) => !prev),
    toggleCommandPalette: () => {
      setPalettePrefix(">");
      setShowCommandPalette((prev) => !prev);
    },
    openSettings: () =>
      tabStore.openTab(
        "rune://settings",
        "Settings",
        "",
        "settings",
        "settings",
      ),
    handleFileClick,
    showConfirmDialog,
    showQuickPick,
  });

  useWorkspaceSync({ fs });

  const {
    handleSave,
    handleSaveAll,
    handleSaveAs,
    handleCloseTab,
    triggerEditorCommand,
  } = useEditorActions({ fs });

  const { handleTabContextMenu } = useTabContextMenu({ showContextMenu });

  const { menus, commands } = useAppCommands({
    fs,
    handleSave,
    handleSaveAll,
    handleSaveAs,
    handleCloseTab,
    setShowTerminal,
    setShowCommandPalette: (show: boolean) => {
      setPalettePrefix(">");
      setShowCommandPalette(show);
    },
    setShowWorkspaceSearch,
    deleteSelectedPaths,
    triggerEditorCommand,
    openPaletteWithPrefix: (prefix: string) => {
      setPalettePrefix(prefix);
      setShowCommandPalette(true);
    },
  });

  // Global Settings Effects
  createEffect(() => {
    document.documentElement.style.setProperty(
      "--editor-font-size",
      `${globalSettings.editorFontSize}px`,
    );
    document.documentElement.style.setProperty(
      "--terminal-font-size",
      `${globalSettings.terminalFontSize}px`,
    );
    document.documentElement.style.setProperty(
      "--editor-font-family",
      globalSettings.editorFontFamily,
    );
  });

  createEffect(() => {
    const current = fs.rootPath();
    if (current) {
      window.dispatchEvent(
        new CustomEvent("rune-workspace-changed", { detail: current }),
      );
    }
  });

  // Listen for open-folder events dispatched by plugins (e.g. open-recent)
  onMount(() => {
    function handleOpenFolderEvent(e: Event) {
      const path = (e as CustomEvent<string>).detail;
      if (path) fs.openFolderByPath(path).catch(console.error);
    }
    function handleOpenFileEvent(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail?.path) {
        handleFileClick({
          path: detail.path,
          name: detail.name || detail.path.split(/[\\/]/).pop() || "",
        });
      }
    }
    window.addEventListener("rune-open-folder", handleOpenFolderEvent);
    window.addEventListener("rune-open-file", handleOpenFileEvent);

    function handleOpenPaletteEvent(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail?.prefix != null) {
        setPalettePrefix(detail.prefix);
        setShowCommandPalette(true);
      }
    }
    window.addEventListener("rune-open-palette", handleOpenPaletteEvent);

    onCleanup(() => {
      window.removeEventListener("rune-open-folder", handleOpenFolderEvent);
      window.removeEventListener("rune-open-file", handleOpenFileEvent);
      window.removeEventListener("rune-open-palette", handleOpenPaletteEvent);
    });
  });

  const windowTitle = () => {
    const tab = tabStore.getFocusedTab();
    if (tab) {
      return `${tab.isDirty ? "● " : ""}${tab.fileName} — Rune Editor`;
    }
    return "Rune Editor";
  };

  const leftActiveTab = () => tabStore.getActiveTab();

  // Layout resize, close, and navigation handlers (removes inline functions from JSX)
  function handleSidebarResize(e: MouseEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = settingsStore.sidebarWidth();
    function onMove(ev: MouseEvent) {
      const delta = ev.clientX - startX;
      settingsStore.setSidebarWidth(
        Math.max(150, Math.min(500, startWidth + delta)),
      );
    }
    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  function handleSplitResize(e: MouseEvent) {
    e.preventDefault();
    const parent = (e.currentTarget as HTMLElement).parentElement;
    if (!parent) return;
    const startX = e.clientX;
    const parentWidth = parent.clientWidth;
    const startPct = settingsStore.splitWidth();
    function onMove(ev: MouseEvent) {
      const delta = ev.clientX - startX;
      const deltaPct = (delta / parentWidth) * 100;
      settingsStore.setSplitWidth(
        Math.max(20, Math.min(80, startPct + deltaPct)),
      );
    }
    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  function handleCloseSplit() {
    const rightTabs = tabStore.rightTabs();
    for (const t of rightTabs) {
      tabStore.moveTabToPane(t.id, "left");
    }
    settingsStore.setSplitActive(false);
  }

  function handleTerminalResize(e: MouseEvent) {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = terminalHeight();
    function onMove(ev: MouseEvent) {
      const delta = startY - ev.clientY;
      const newHeight = Math.max(
        100,
        Math.min(window.innerHeight * 0.8, startHeight + delta),
      );
      setTerminalHeight(newHeight);
    }
    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  function handleWelcomeOpenPalette() {
    setPalettePrefix(">");
    setShowCommandPalette(true);
  }

  function handleWorkspaceSearchSelect(filePath: string) {
    setShowWorkspaceSearch(false);
    handleFileClick({
      path: filePath,
      name: filePath.split(/[\\/]/).pop() || "",
    });
  }

  function handleFileTreeSelect(entry: any) {
    handleFileClick(entry, "left");
  }

  function handleStartEdit(parentPath: string, mode: EditingMode) {
    setEditingItem({ parentPath, mode });
  }

  function handleCancelEdit() {
    setEditingItem(null);
  }

  return {
    fs,
    ctxMenu,
    setCtxMenu,
    showCommandPalette,
    setShowCommandPalette,
    palettePrefix,
    setPalettePrefix,
    showWorkspaceSearch,
    setShowWorkspaceSearch,
    showTerminal,
    setShowTerminal,
    terminalHeight,
    editingItem,
    confirmState,
    quickPickState,
    selectedPaths,
    setSelectedPaths,
    handleEditorChange,
    handleFileTreeSelect,
    handleFileTreeContextMenu,
    handleEmptyContextMenu,
    handleSubmitEdit,
    handleStartEdit,
    handleCancelEdit,
    handleTabContextMenu,
    menus,
    commands,
    windowTitle,
    leftActiveTab,
    handleWelcomeOpenPalette,
    handleSidebarResize,
    handleSplitResize,
    handleCloseSplit,
    handleTerminalResize,
    handleWorkspaceSearchSelect,
    fileClipboard,
  };
}
