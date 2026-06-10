import { Show, For } from "solid-js";
import { FileIcon } from "@/features/file-tree/FileIcon";
import { getStatusBadge, parseGitFile } from "@/utils/git";

interface GitFileAction {
  icon: any;
  title: string;
  onClick: (e: MouseEvent) => void;
  hoverColor?: string;
}

interface GitFileItemProps {
  file: string;
  status: string;
  onClick: () => void;
  actions: GitFileAction[];
}

export function GitFileItem(props: GitFileItemProps) {
  const parsed = () => parseGitFile(props.file, props.status);

  return (
    <div 
      class="flex items-center justify-between group px-2 h-[22px] rounded hover:bg-[var(--color-bg-secondary)] text-xs cursor-pointer"
      onClick={props.onClick}
    >
      <div class="flex items-center gap-1.5 truncate">
        <FileIcon name={parsed().fileName} isDirectory={false} isExpanded={false} />
        <span class={`truncate ${parsed().isDeleted ? 'line-through opacity-60' : ''}`} style={{ color: "var(--color-fg)" }}>
          {parsed().fileName}
        </span>
        <Show when={parsed().dirName}>
          <span class="text-[10px] truncate opacity-70" style={{ color: "var(--color-fg-muted)" }}>{parsed().dirName}</span>
        </Show>
      </div>
      <div class="flex items-center gap-1 shrink-0">
        <div class="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <For each={props.actions}>
            {(action) => {
              const Icon = action.icon;
              return (
                <button 
                  class={`p-1 transition-colors ${action.hoverColor || "hover:text-[var(--color-accent)]"}`}
                  onClick={action.onClick}
                  title={action.title}
                >
                  <Icon size={12} />
                </button>
              );
            }}
          </For>
        </div>
        <span class="font-bold w-3 text-center ml-1" style={{ color: getStatusBadge(props.status).color }}>
          {getStatusBadge(props.status).letter}
        </span>
      </div>
    </div>
  );
}
