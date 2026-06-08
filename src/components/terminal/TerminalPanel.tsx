import { For, Show } from "solid-js";
import { X, Plus, Terminal as TerminalIcon } from "lucide-solid";
import { TerminalInstance } from "./TerminalInstance";
import { useTerminalPanel } from "@/hooks/useTerminalPanel";

interface TerminalPanelProps {
  onClose: () => void;
  rootPath: string | null;
}

export function TerminalPanel(props: TerminalPanelProps) {
  const {
    tabs,
    activeTabId,
    setActiveTabId,
    editingTabId,
    setEditingTabId,
    handleAddTab,
    handleCloseTab,
    handleRenameTab,
  } = useTerminalPanel(props.onClose, () => props.rootPath);

  return (
    <div class="flex flex-col h-full shrink-0 overflow-hidden">
      {/* Header Toolbar / Tabs */}
      <div
        class="flex items-center pr-2 h-[32px] shrink-0 text-xs select-none overflow-x-auto"
        style={{
          "border-bottom": "1px solid var(--color-border)",
          background: "var(--color-titlebar-bg)",
        }}
      >
        <For each={tabs()}>
          {(tab) => (
            <div
              class="flex items-center h-full pl-2 pr-3 border-r cursor-pointer group"
              style={{
                "border-color": "var(--color-border)",
                background:
                  activeTabId() === tab.id
                    ? "var(--color-bg-secondary)"
                    : "transparent",
                color:
                  activeTabId() === tab.id
                    ? "var(--color-fg)"
                    : "var(--color-fg-muted)",
              }}
              onClick={() => setActiveTabId(tab.id)}
              onDblClick={() => setEditingTabId(tab.id)}
            >
              <TerminalIcon size={12} class="mr-1.5 opacity-70" />
              <Show
                when={editingTabId() === tab.id}
                fallback={<span>{tab.name}</span>}
              >
                <input
                  type="text"
                  value={tab.name}
                  class="bg-transparent border-none outline-none text-[11px] w-20"
                  style={{ color: "var(--color-fg)" }}
                  autofocus
                  onBlur={(e) => handleRenameTab(tab.id, e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleRenameTab(tab.id, e.currentTarget.value);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </Show>
              <button
                class="ml-2 opacity-0 group-hover:opacity-100 transition-opacity hover:text-[var(--color-error)]"
                onClick={(e) => handleCloseTab(tab.id, e)}
              >
                <X size={12} />
              </button>
            </div>
          )}
        </For>
        <button
          class="h-full px-3 hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-fg)] transition-colors text-[var(--color-fg-muted)]"
          onClick={handleAddTab}
          title="New Terminal"
        >
          <Plus size={14} />
        </button>

        <div class="flex-1" />

        <div class="flex items-center gap-2 pr-2">
          <button
            class="hover:text-[var(--color-error)] transition-colors p-1"
            onClick={props.onClose}
            title="Close Panel"
            style={{ color: "var(--color-fg-muted)" }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Terminal View Divs */}
      <div class="flex-1 relative overflow-hidden min-h-0">
        <For each={tabs().map((t) => t.id)}>
          {(id) => (
            <TerminalInstance
              id={id}
              rootPath={props.rootPath}
              isActive={activeTabId() === id}
              onExit={(exitId) => handleCloseTab(exitId)}
            />
          )}
        </For>
      </div>
    </div>
  );
}
