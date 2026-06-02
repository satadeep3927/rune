import { Show, For } from "solid-js";
import type { FileEntry } from "../../types";
import { FileTreeNode, InlineInput, type EditingItem, type EditingMode } from "./FileTreeNode";
import { Folder, File, RefreshCw, Play, Terminal, Settings } from "lucide-solid";

interface FileTreeProps {
  tree: FileEntry[];
  rootPath: string | null;
  loading: boolean;
  width: number;
  onFileClick: (entry: FileEntry) => void;
  onToggleDir: (path: string) => void;
  onOpenFolder: () => void;
  onRefresh: () => void;
  onContextMenu?: (entry: FileEntry, e: MouseEvent) => void;
  onEmptyContextMenu?: (e: MouseEvent) => void;
  editingItem?: EditingItem | null;
  onSubmitEdit?: (parentPath: string, name: string, mode: EditingMode, originalName?: string) => void;
  onCancelEdit?: () => void;
  onStartEdit?: (parentPath: string, mode: EditingMode) => void;
  activeFilePath?: string;
  selectedPath?: string | null;
  onSelectPath?: (path: string | null) => void;
  onRunScript?: () => void;
  onOpenSettings?: () => void;
  onToggleTerminal?: () => void;
}

export function FileTree(props: FileTreeProps) {
  return (
    <aside
      class="flex flex-col h-full shrink-0"
      style={{
        width: `${props.width}px`,
        background: "var(--color-sidebar-bg)",
        "border-right": "1px solid var(--color-border)",
      }}
    >
      <div
        class="flex items-center justify-between px-3 h-[32px] shrink-0 select-none"
        style={{
          "border-bottom": "1px solid var(--color-border)",
          color: "var(--color-fg-muted)",
        }}
      >
        <div class="flex items-center justify-between w-full">
          <Show when={props.rootPath}>
            <button
              class="hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-accent)] transition-colors p-1 rounded"
              onClick={() => props.onStartEdit?.(props.rootPath!, "new-file")}
              title="New File..."
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              <File size={14} style={{ color: "var(--color-fg-muted)" }} />
            </button>
            <button
              class="hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-accent)] transition-colors p-1 rounded"
              onClick={() => props.onStartEdit?.(props.rootPath!, "new-folder")}
              title="New Folder..."
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              <Folder size={14} style={{ color: "var(--color-fg-muted)" }} />
            </button>
            <button
              class="hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-accent)] transition-colors p-1 rounded"
              onClick={props.onRefresh}
              title="Refresh"
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              <RefreshCw size={14} style={{ color: "var(--color-fg-muted)" }} />
            </button>
            <button
              class="hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-accent)] transition-colors p-1 rounded"
              onClick={props.onRunScript}
              title="Run Script (.rune/settings.json)"
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              <Play size={14} fill="currentColor" style={{ color: "var(--color-fg-muted)" }} />
            </button>
            <button
              class="hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-accent)] transition-colors p-1 rounded"
              onClick={props.onToggleTerminal}
              title="Toggle Integrated Terminal"
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              <Terminal size={14} style={{ color: "var(--color-fg-muted)" }} />
            </button>
            <button
              class="hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-accent)] transition-colors p-1 rounded"
              onClick={props.onOpenSettings}
              title="Open Rune Settings"
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              <Settings size={14} style={{ color: "var(--color-fg-muted)" }} />
            </button>
          </Show>
        </div>
      </div>

      <div
        class="flex-1 overflow-y-auto py-1"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            props.onSelectPath?.(null);
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          if (e.target === e.currentTarget) {
            props.onEmptyContextMenu?.(e);
          }
        }}
      >
        <Show
          when={props.rootPath}
          fallback={
            <div class="flex flex-col items-center justify-center h-full gap-3 px-4">
              <p class="text-xs" style={{ color: "var(--color-fg-muted)" }}>
                No folder opened
              </p>
              <button
                class="text-xs px-3 py-1.5"
                style={{
                  border: "1px solid var(--color-border)",
                  color: "var(--color-accent)",
                  "border-radius": "0px",
                }}
                onClick={props.onOpenFolder}
              >
                Open Folder
              </button>
            </div>
          }
        >
          <Show
            when={!props.loading}
            fallback={
              <div class="flex items-center justify-center h-8">
                <span class="text-xs" style={{ color: "var(--color-fg-muted)" }}>
                  Loading...
                </span>
              </div>
            }
          >
            <div
              class="px-3 py-1 text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--color-fg-muted)" }}
            >
              {props.rootPath?.split(/[\\/]/).pop()}
            </div>
            <Show when={props.editingItem?.parentPath === props.rootPath && (props.editingItem.mode === "new-file" || props.editingItem.mode === "new-folder")}>
              <InlineInput
                depth={0}
                initialValue=""
                icon={props.editingItem!.mode === "new-folder" ? "folder" : "file"}
                onSubmit={(name) => props.onSubmitEdit?.(props.rootPath!, name, props.editingItem!.mode)}
                onCancel={() => props.onCancelEdit?.()}
              />
            </Show>
            <For each={props.tree}>
              {(entry) => (
                <FileTreeNode
                  entry={entry}
                  depth={0}
                  parentExpanded={[]}
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
    </aside>
  );
}
