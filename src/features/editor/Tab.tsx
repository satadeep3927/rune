import { Show } from "solid-js";
import type { Tab as TabType } from "../../types";
import { FileIcon } from "../file-tree/FileIcon";

interface TabProps {
  tab: TabType;
  isActive: boolean;
  onClick: () => void;
  onClose: (e: MouseEvent) => void;
  onContextMenu?: (e: MouseEvent) => void;
}

export function Tab(props: TabProps) {
  return (
    <button
      class="flex items-center gap-1.5 h-full px-3 text-xs shrink-0 group relative"
      style={{
        background: props.isActive ? "var(--color-bg)" : "var(--color-tab-bg)",
        color: props.isActive ? "var(--color-fg)" : "var(--color-fg-muted)",
        "border-right": "1px solid var(--color-border)",
        "border-bottom": props.isActive ? "1px solid var(--color-bg)" : "1px solid var(--color-border)",
        "margin-bottom": props.isActive ? "-1px" : "0",
        cursor: "pointer",
      }}
      onClick={props.onClick}
      onContextMenu={props.onContextMenu}
    >
      <FileIcon name={props.tab.fileName} isDirectory={false} />

      <Show when={props.tab.isDirty}>
        <span
          class="w-2 h-2 shrink-0"
          style={{ background: "var(--color-accent)", "border-radius": "50%" }}
        />
      </Show>

      <span class="truncate max-w-[120px]">{props.tab.fileName}</span>

      <span
        class="ml-1 w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-[var(--color-bg-tertiary)] transition-opacity"
        onClick={props.onClose}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.2">
          <line x1="2" y1="2" x2="8" y2="8" />
          <line x1="8" y1="2" x2="2" y2="8" />
        </svg>
      </span>
    </button>
  );
}
