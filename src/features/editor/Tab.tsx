import { Show } from "solid-js";
import type { Tab as TabType } from "@/types";
import { FileIcon } from "@/features/file-tree/FileIcon";
import { XIcon } from "@/components/ui/icons/XIcon";
import { cn } from "@/utils/cn";

interface TabProps {
  tab: TabType;
  isActive: boolean;
  onClick: () => void;
  onClose: (e: MouseEvent) => void;
  onContextMenu?: (e: MouseEvent) => void;
  onDragDrop?: (sourceTabId: string, targetTabId: string) => void;
}

export function Tab(props: TabProps) {
  return (
    <button
      class={cn(
        "flex items-center gap-1.5 h-full px-3 text-xs shrink-0 group relative border-r border-[var(--color-border)] cursor-pointer transition-colors",
        props.isActive
          ? "bg-[var(--color-bg)] text-[var(--color-fg)] border-b border-b-[var(--color-bg)] -mb-px"
          : "bg-[var(--color-tab-bg)] text-[var(--color-fg-muted)] border-b border-b-[var(--color-border)] mb-0",
      )}
      onClick={props.onClick}
      onContextMenu={props.onContextMenu}
      draggable={true}
      onDragStart={(e) => {
        e.dataTransfer?.setData("application/rune-tab", props.tab.id);
        if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
      }}
      onDragEnter={(e) => e.preventDefault()}
      onDragOver={(e) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const sourceTabId = e.dataTransfer?.getData("application/rune-tab");
        if (sourceTabId && sourceTabId !== props.tab.id) {
          props.onDragDrop?.(sourceTabId, props.tab.id);
        }
      }}
    >
      <FileIcon name={props.tab.fileName} isDirectory={false} />

      <Show when={props.tab.isDirty}>
        <span class="w-2 h-2 shrink-0 bg-[var(--color-accent)] rounded-full" />
      </Show>

      <span class="truncate max-w-[120px]">{props.tab.fileName}</span>

      <span
        class="ml-1 w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-[var(--color-bg-tertiary)] transition-opacity rounded-sm"
        onClick={props.onClose}
      >
        <XIcon />
      </span>
    </button>
  );
}
