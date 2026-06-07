import { tabStore } from "@/stores/tabs";
import { pluginRegistry } from "@/plugins";
import type { FileEntry, PaneSide } from "@/types";
import type { ContextMenuItem } from "@/components/ContextMenu";
import type { EditingMode } from "@/features/file-tree/FileTreeNode";

interface ExplorerActionsOptions {
  fs: any;
  selectedPaths: () => Set<string>;
  setSelectedPaths: (paths: Set<string>) => void;
  setEditingItem: (
    item: { parentPath: string; mode: EditingMode } | null,
  ) => void;
  showContextMenu: (x: number, y: number, items: ContextMenuItem[]) => void;
  confirmDelete: (name: string, onConfirm: () => void) => void;
  fileClipboard?: {
    handleCopy: (paths: string[]) => void;
    handleCut: (paths: string[]) => void;
    handlePaste: (destinationFolder: string) => void;
    internalPaths: () => string[];
  };
}

export function useExplorerActions(options: ExplorerActionsOptions) {
  const {
    fs,
    selectedPaths,
    setSelectedPaths,
    setEditingItem,
    showContextMenu,
    confirmDelete,
    fileClipboard,
  } = options;

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
      if (skipConfirm) {
        await doDelete();
      } else {
        confirmDelete(name, doDelete);
      }
    } else {
      if (skipConfirm) {
        await doDelete();
      } else {
        confirmDelete(`${paths.size} items`, doDelete);
      }
    }
  }

  async function handleFileClick(
    entry: { path: string; name: string },
    pane: PaneSide = "left",
  ) {
    try {
      const { content, language, fileType } = await fs.readFileContent(
        entry.path,
      );
      const dataUrl =
        fileType === "image" || fileType === "pdf" ? content : undefined;
      const tabContent =
        fileType === "image" || fileType === "pdf" ? "" : content;
      tabStore.openTab(
        entry.path,
        entry.name,
        tabContent,
        language,
        fileType,
        dataUrl,
        pane,
      );
    } catch (err) {
      console.error("Failed to open file:", err);
    }
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
    if (!selectedPaths().has(entry.path)) {
      setSelectedPaths(new Set([entry.path]));
    }
    const multi = selectedPaths().size > 1;
    const items: ContextMenuItem[] = [];

    if (multi) {
      items.push({
        label: `Delete ${selectedPaths().size} Items`,
        action: () => deleteSelectedPaths(),
      });
    } else if (entry.isDirectory) {
      items.push(
        {
          label: "New File",
          action: () => {
            fs.ensureExpanded(entry.path).then(() =>
              setEditingItem({ parentPath: entry.path, mode: "new-file" }),
            );
          },
        },
        {
          label: "New Folder",
          action: () => {
            fs.ensureExpanded(entry.path).then(() =>
              setEditingItem({ parentPath: entry.path, mode: "new-folder" }),
            );
          },
        },
        { separator: true, label: "" },
        {
          label: "Cut",
          action: () => fileClipboard?.handleCut(Array.from(selectedPaths())),
        },
        {
          label: "Copy",
          action: () => fileClipboard?.handleCopy(Array.from(selectedPaths())),
        },
        {
          label: "Paste",
          action: () => fileClipboard?.handlePaste(entry.path),
        },
        { separator: true, label: "" },
        {
          label: "Copy Path",
          action: () => navigator.clipboard.writeText(entry.path),
        },
        {
          label: "Copy Relative Path",
          action: () =>
            navigator.clipboard.writeText(getRelativePath(entry.path)),
        },
        {
          label: "Reveal in Explorer",
          action: () => revealInExplorer(entry.path),
        },
        { separator: true, label: "" },
        {
          label: "Rename",
          action: () =>
            setEditingItem({ parentPath: entry.path, mode: "rename" }),
        },
        { label: "Delete", action: () => deleteSelectedPaths() },
        { separator: true, label: "" },
        { label: "Collapse All", action: () => fs.collapseAll() },
      );
    } else {
      items.push(
        { label: "Open", action: () => handleFileClick(entry) },
        { separator: true, label: "" },
        {
          label: "Cut",
          action: () => fileClipboard?.handleCut(Array.from(selectedPaths())),
        },
        {
          label: "Copy",
          action: () => fileClipboard?.handleCopy(Array.from(selectedPaths())),
        },
        { separator: true, label: "" },
        {
          label: "Copy Path",
          action: () => navigator.clipboard.writeText(entry.path),
        },
        {
          label: "Copy Relative Path",
          action: () =>
            navigator.clipboard.writeText(getRelativePath(entry.path)),
        },
        {
          label: "Reveal in Explorer",
          action: () => revealInExplorer(entry.path),
        },
        { separator: true, label: "" },
        {
          label: "Rename",
          action: () =>
            setEditingItem({ parentPath: entry.path, mode: "rename" }),
        },
        { label: "Delete", action: () => deleteSelectedPaths() },
      );
    }

    const pluginItems = pluginRegistry.getContextMenuItems("file-tree", {
      entry,
      selectedPaths: selectedPaths(),
    });
    if (pluginItems.length > 0) {
      items.push({ separator: true, label: "" });
      for (const p of pluginItems) {
        if ("separator" in p && p.separator) {
          items.push({ separator: true, label: "" });
        } else {
          const reg = p as any;
          items.push({
            label: reg.label,
            icon: reg.icon,
            hint: reg.hint,
            action: () => reg.action({ entry, selectedPaths: selectedPaths() }),
          });
        }
      }
    }

    showContextMenu(e.clientX, e.clientY, items);
  }

  function handleEmptyContextMenu(e: MouseEvent) {
    const root = fs.rootPath();
    if (!root) return;
    const items: ContextMenuItem[] = [
      {
        label: "New File",
        action: () => setEditingItem({ parentPath: root, mode: "new-file" }),
      },
      {
        label: "New Folder",
        action: () => setEditingItem({ parentPath: root, mode: "new-folder" }),
      },
    ];
    showContextMenu(e.clientX, e.clientY, items);
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

  async function handleSubmitEdit(
    parentPath: string,
    name: string,
    mode: EditingMode,
    originalName?: string,
  ) {
    if (mode === "new-file") {
      await fs.createNewFile(parentPath, name);
    } else if (mode === "new-folder") {
      await fs.createNewFolder(parentPath, name);
    } else if (mode === "rename" && originalName) {
      const entry = findEntryByPath(parentPath);
      if (entry) await fs.renameEntry(entry.path, name);
    }
    setEditingItem(null);
  }

  return {
    deleteSelectedPaths,
    handleFileClick,
    handleFileTreeContextMenu,
    handleEmptyContextMenu,
    handleSubmitEdit,
  };
}
