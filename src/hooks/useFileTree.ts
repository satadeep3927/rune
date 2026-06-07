import { createSignal } from "solid-js";
import type { FileEntry } from "@/types";
import { type EditingItem } from "@/features/file-tree/FileTreeNode";

interface UseFileTreeProps {
  tree: FileEntry[];
  activeFilePath?: string;
  selectedPaths?: Set<string>;
  onSelectPaths?: (paths: Set<string>) => void;
  onToggleDir: (path: string) => void;
  onFileClick: (entry: FileEntry) => void;
  editingItem?: EditingItem | null;
  fileClipboard?: {
    handleCopy: (paths: string[]) => void;
    handleCut: (paths: string[]) => void;
    handlePaste: (destinationFolder: string) => void;
  };
}

export function useFileTree(props: UseFileTreeProps) {
  const [anchorPath, setAnchorPath] = createSignal<string | null>(null);
  const [focusPath, setFocusPath] = createSignal<string | null>(null);

  function getVisibleEntries(): FileEntry[] {
    const visible: FileEntry[] = [];
    function walk(entries: FileEntry[]) {
      for (const entry of entries) {
        visible.push(entry);
        if (entry.isDirectory && entry.isExpanded && entry.children) {
          walk(entry.children);
        }
      }
    }
    walk(props.tree);
    return visible;
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (props.editingItem) return;

    const visible = getVisibleEntries();
    if (visible.length === 0) return;

    let currentIndex = -1;

    if (focusPath()) {
      currentIndex = visible.findIndex((v) => v.path === focusPath());
    }

    if (
      currentIndex === -1 &&
      props.selectedPaths &&
      props.selectedPaths.size > 0
    ) {
      const currentSelected = Array.from(props.selectedPaths);
      currentIndex = visible.findIndex(
        (v) => v.path === currentSelected[currentSelected.length - 1],
      );
    }
    if (currentIndex === -1 && props.activeFilePath) {
      currentIndex = visible.findIndex((v) => v.path === props.activeFilePath);
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
      if (currentIndex !== -1 && props.fileClipboard) {
        e.preventDefault();
        const paths =
          props.selectedPaths && props.selectedPaths.size > 0
            ? Array.from(props.selectedPaths)
            : [visible[currentIndex].path];
        props.fileClipboard.handleCopy(paths);
      }
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "x") {
      if (currentIndex !== -1 && props.fileClipboard) {
        e.preventDefault();
        const paths =
          props.selectedPaths && props.selectedPaths.size > 0
            ? Array.from(props.selectedPaths)
            : [visible[currentIndex].path];
        props.fileClipboard.handleCut(paths);
      }
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
      if (props.fileClipboard) {
        e.preventDefault();
        let dest = props.tree[0]?.path
          ? props.tree[0].path.replace(/[\\/][^\\/]+$/, "")
          : "";
        if (currentIndex !== -1) {
          const entry = visible[currentIndex];
          if (entry.isDirectory) {
            dest = entry.path;
          } else {
            const sep = entry.path.includes("\\") ? "\\" : "/";
            const lastSep = entry.path.lastIndexOf(sep);
            if (lastSep > 0) dest = entry.path.substring(0, lastSep);
          }
        }
        if (dest) {
          props.fileClipboard.handlePaste(dest);
        }
      }
      return;
    }

    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();

      if (currentIndex === -1) {
        const first = visible[0];
        props.onSelectPaths?.(new Set([first.path]));
        setAnchorPath(first.path);
        setFocusPath(first.path);
        return;
      }

      const nextIndex =
        e.key === "ArrowDown"
          ? Math.min(currentIndex + 1, visible.length - 1)
          : Math.max(currentIndex - 1, 0);

      const nextEntry = visible[nextIndex];

      if (e.shiftKey) {
        const anchor = anchorPath() || visible[currentIndex].path;
        const anchorIndex = visible.findIndex((v) => v.path === anchor);
        const start = Math.min(anchorIndex, nextIndex);
        const end = Math.max(anchorIndex, nextIndex);

        const newSelection = new Set<string>();
        for (let i = start; i <= end; i++) {
          newSelection.add(visible[i].path);
        }
        props.onSelectPaths?.(newSelection);
        setFocusPath(nextEntry.path);
      } else {
        props.onSelectPaths?.(new Set([nextEntry.path]));
        setAnchorPath(nextEntry.path);
        setFocusPath(nextEntry.path);
      }
    } else if (e.key === "ArrowRight") {
      if (currentIndex !== -1) {
        e.preventDefault();
        const entry = visible[currentIndex];
        if (entry.isDirectory && !entry.isExpanded) {
          props.onToggleDir(entry.path);
        } else if (
          entry.isDirectory &&
          entry.isExpanded &&
          currentIndex + 1 < visible.length
        ) {
          const next = visible[currentIndex + 1];
          props.onSelectPaths?.(new Set([next.path]));
          setAnchorPath(next.path);
        }
      }
    } else if (e.key === "ArrowLeft") {
      if (currentIndex !== -1) {
        e.preventDefault();
        const entry = visible[currentIndex];
        if (entry.isDirectory && entry.isExpanded) {
          props.onToggleDir(entry.path);
        } else {
          const sep = entry.path.includes("\\") ? "\\" : "/";
          const lastSep = entry.path.lastIndexOf(sep);
          if (lastSep > 0) {
            const parentPath = entry.path.substring(0, lastSep);
            const parentIndex = visible.findIndex((v) => v.path === parentPath);
            if (parentIndex !== -1) {
              props.onSelectPaths?.(new Set([parentPath]));
              setAnchorPath(parentPath);
            }
          }
        }
      }
    } else if (e.key === "Enter") {
      if (currentIndex !== -1) {
        e.preventDefault();
        const entry = visible[currentIndex];
        if (entry.isDirectory) {
          props.onToggleDir(entry.path);
        } else {
          props.onFileClick(entry);
        }
      }
    }
  }

  return {
    handleKeyDown,
    setAnchorPath,
  };
}
