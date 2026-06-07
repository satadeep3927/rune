import { createSignal } from "solid-js";
import type { FileEntry } from "@/types";
import { type EditingItem } from "@/features/file-tree/FileTreeNode";

interface UseFileTreeNodeProps {
  entry: FileEntry;
  activeFilePath?: string;
  selectedPaths?: Set<string>;
  onSelectPaths?: (paths: Set<string>) => void;
  onToggleDir: (path: string) => void;
  onFileClick: (entry: FileEntry) => void;
  editingItem?: EditingItem | null;
}

export function useFileTreeNode(props: UseFileTreeNodeProps) {
  const [isHovered, setIsHovered] = createSignal(false);

  function handleClick(e: MouseEvent) {
    if (e.ctrlKey || e.metaKey) {
      const current = props.selectedPaths ?? new Set<string>();
      const next = new Set(current);
      if (next.has(props.entry.path)) {
        next.delete(props.entry.path);
      } else {
        next.add(props.entry.path);
      }
      props.onSelectPaths?.(next);
    } else {
      props.onSelectPaths?.(new Set([props.entry.path]));
      if (props.entry.isDirectory) {
        props.onToggleDir(props.entry.path);
      } else {
        props.onFileClick(props.entry);
      }
    }
  }

  const isSelected = () => props.selectedPaths?.has(props.entry.path) ?? false;
  const isActive = () => props.activeFilePath === props.entry.path;

  const isRenaming = () =>
    props.editingItem?.mode === "rename" &&
    props.editingItem?.parentPath === props.entry.path;

  return {
    isHovered,
    setIsHovered,
    handleClick,
    isSelected,
    isActive,
    isRenaming,
  };
}
