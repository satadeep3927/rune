import { Show, For, createSignal, onMount } from "solid-js";
import type { FileEntry } from "../../types";
import { FileIcon } from "./FileIcon";

export type EditingMode = "new-file" | "new-folder" | "rename";

export interface EditingItem {
  parentPath: string;
  mode: EditingMode;
  originalName?: string;
}

interface FileTreeNodeProps {
  entry: FileEntry;
  depth: number;
  parentExpanded: boolean[];
  onFileClick: (entry: FileEntry) => void;
  onToggleDir: (path: string) => void;
  onContextMenu?: (entry: FileEntry, e: MouseEvent) => void;
  activeFilePath?: string;
  selectedPath?: string | null;
  onSelectPath?: (path: string | null) => void;
  editingItem?: EditingItem | null;
  onSubmitEdit?: (parentPath: string, name: string, mode: EditingMode, originalName?: string) => void;
  onCancelEdit?: () => void;
}

function IndentGuides(props: { levels: number }) {
  return (
    <div class="flex shrink-0" style={{ width: `${props.levels * 12}px` }}>
      <For each={Array(props.levels).fill(false)}>
        {() => (
          <div
            class="w-[12px] h-[22px]"
            style={{ "border-left": "1px solid var(--color-border)" }}
          />
        )}
      </For>
    </div>
  );
}

export function InlineInput(props: {
  depth: number;
  initialValue: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
  icon: "file" | "folder";
}) {
  let inputRef!: HTMLInputElement;

  onMount(() => {
    inputRef?.focus();
    const dot = props.initialValue.lastIndexOf(".");
    if (dot > 0) {
      inputRef?.setSelectionRange(0, dot);
    } else {
      inputRef?.select();
    }
  });

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = inputRef.value.trim();
      if (val) props.onSubmit(val);
      else props.onCancel();
    } else if (e.key === "Escape") {
      e.preventDefault();
      props.onCancel();
    }
  }

  return (
    <div class="flex items-center gap-1 text-xs h-[22px] px-2">
      <div class="flex shrink-0" style={{ width: `${props.depth * 12}px` }} />
      <Show when={props.icon === "folder"}>
        <FileIcon name="" isDirectory={true} isExpanded={false} />
      </Show>
      <Show when={props.icon === "file"}>
        <FileIcon name="untitled" isDirectory={false} />
      </Show>
      <input
        ref={inputRef}
        type="text"
        value={props.initialValue}
        class="flex-1 bg-transparent outline-none text-xs"
        style={{
          color: "var(--color-fg)",
          border: "none",
          "border-bottom": "1px solid var(--color-accent)",
          padding: "0",
          "font-family": "'Inter', 'Segoe UI', system-ui, sans-serif",
        }}
        onkeydown={handleKeydown}
        onBlur={() => {
          const val = inputRef.value.trim();
          if (val) props.onSubmit(val);
          else props.onCancel();
        }}
      />
    </div>
  );
}

export function FileTreeNode(props: FileTreeNodeProps) {
  const [isHovered, setIsHovered] = createSignal(false);

  function handleClick() {
    props.onSelectPath?.(props.entry.path);
    if (props.entry.isDirectory) {
      props.onToggleDir(props.entry.path);
    } else {
      props.onFileClick(props.entry);
    }
  }

  const isSelected = () => props.selectedPath === props.entry.path;
  const isActive = () => props.activeFilePath === props.entry.path;

  const isRenaming = () =>
    props.editingItem?.mode === "rename" &&
    props.editingItem?.parentPath === props.entry.path;

  return (
    <div>
      <Show
        when={!isRenaming()}
        fallback={
          <InlineInput
            depth={props.depth}
            initialValue={props.entry.name}
            icon={props.entry.isDirectory ? "folder" : "file"}
            onSubmit={(name) => props.onSubmitEdit?.(props.entry.path, name, "rename", props.entry.name)}
            onCancel={() => props.onCancelEdit?.()}
          />
        }
      >
        <div
          class="flex items-center gap-1 cursor-pointer text-xs h-[22px] px-2 rounded-sm"
          style={{
            background: isSelected()
              ? "var(--color-bg-tertiary)"
              : isActive()
                ? "var(--color-bg-secondary)"
                : isHovered()
                  ? "var(--color-bg-secondary)"
                  : "transparent",
            color: isSelected()
              ? "var(--color-accent)"
              : isActive()
                ? "var(--color-fg)"
                : "inherit",
            "font-weight": isSelected() ? "600" : "normal",
          }}
          onClick={handleClick}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            props.onContextMenu?.(props.entry, e);
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <IndentGuides levels={props.parentExpanded.length} />

          <FileIcon
            name={props.entry.name}
            isDirectory={props.entry.isDirectory}
            isExpanded={props.entry.isExpanded}
          />

          <span class="truncate">{props.entry.name}</span>
        </div>
      </Show>

      <Show when={props.entry.isDirectory && props.entry.isExpanded}>
        <Show when={props.editingItem?.parentPath === props.entry.path && (props.editingItem.mode === "new-file" || props.editingItem.mode === "new-folder")}>
          <InlineInput
            depth={props.depth + 1}
            initialValue=""
            icon={props.editingItem!.mode === "new-folder" ? "folder" : "file"}
            onSubmit={(name) => props.onSubmitEdit?.(props.editingItem!.parentPath, name, props.editingItem!.mode)}
            onCancel={() => props.onCancelEdit?.()}
          />
        </Show>

        <Show when={props.entry.children}>
          <For each={props.entry.children}>
            {(child) => (
              <FileTreeNode
                entry={child}
                depth={props.depth + 1}
                parentExpanded={[...props.parentExpanded, props.entry.isExpanded ?? false]}
                onFileClick={props.onFileClick}
                onToggleDir={props.onToggleDir}
                onContextMenu={props.onContextMenu}
                activeFilePath={props.activeFilePath}
                selectedPath={props.selectedPath}
                onSelectPath={props.onSelectPath}
                editingItem={props.editingItem}
                onSubmitEdit={props.onSubmitEdit}
                onCancelEdit={props.onCancelEdit}
              />
            )}
          </For>
        </Show>
      </Show>
    </div>
  );
}
