import { createSignal, For, Show, onCleanup, onMount } from "solid-js";

export interface CommandItem {
  id: string;
  label: string;
  shortcut?: string;
  action: () => void;
  category?: string;
}

interface CommandPaletteProps {
  commands: CommandItem[];
  onClose: () => void;
}

export function CommandPalette(props: CommandPaletteProps) {
  const [query, setQuery] = createSignal("");
  const [selectedIndex, setSelectedIndex] = createSignal(0);
  let inputRef!: HTMLInputElement;
  let listRef!: HTMLDivElement;

  const filtered = () => {
    const q = query().toLowerCase().trim();
    if (!q) return props.commands;
    return props.commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        (c.category ?? "").toLowerCase().includes(q)
    );
  };

  onMount(() => {
    inputRef?.focus();
  });

  function executeSelected() {
    const items = filtered();
    const idx = selectedIndex();
    if (items[idx]) {
      props.onClose();
      items[idx].action();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    const items = filtered();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1));
      scrollToSelected();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
      scrollToSelected();
    } else if (e.key === "Enter") {
      e.preventDefault();
      executeSelected();
    } else if (e.key === "Escape") {
      e.preventDefault();
      props.onClose();
    }
  }

  function scrollToSelected() {
    requestAnimationFrame(() => {
      const el = listRef?.children[selectedIndex()] as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    });
  }

  function handleClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest("[data-command-palette]")) {
      props.onClose();
    }
  }

  document.addEventListener("click", handleClickOutside);
  onCleanup(() => document.removeEventListener("click", handleClickOutside));

  return (
    <div
      data-command-palette
      class="fixed inset-0 flex justify-center pt-[15%] backdrop-blur-[3px]"
      style={{ "z-index": 200, background: "rgba(0,0,0,0.5)" }}
    >
      <div
        class="w-[520px] max-h-[400px] flex flex-col shrink-0 overflow-hidden"
        style={{
          background: "var(--color-bg-secondary)",
          border: "1px solid var(--color-border)",
          "border-radius": "8px",
          "box-shadow": "0 10px 30px rgba(0,0,0,0.5)",
        }}
      >
        <div
          class="flex items-center px-3 h-[36px] shrink-0"
          style={{ "border-bottom": "1px solid var(--color-border)" }}
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command..."
            value={query()}
            onInput={(e) => {
              setQuery(e.currentTarget.value);
              setSelectedIndex(0);
            }}
            onkeydown={handleKeydown}
            class="w-full bg-transparent outline-none text-[13px]"
            style={{
              color: "var(--color-fg)",
              "font-family": "'Inter', 'Segoe UI', system-ui, sans-serif",
            }}
          />
        </div>
        <div ref={listRef} class="flex-1 overflow-y-auto py-1">
          <For each={filtered()}>
            {(item, i) => (
              <button
                class="w-full flex items-center justify-between px-3 py-[6px] text-[12px] text-left transition-colors"
                style={{
                  color: selectedIndex() === i() ? "var(--color-fg)" : "var(--color-fg)",
                  background: selectedIndex() === i() ? "var(--color-bg-tertiary)" : "transparent",
                  cursor: "pointer",
                  border: "none",
                }}
                onMouseEnter={() => setSelectedIndex(i())}
                onClick={() => {
                  props.onClose();
                  item.action();
                }}
              >
                <span>
                  {item.category && (
                    <span style={{ color: "var(--color-fg-muted)" }}>
                      {item.category}:{" "}
                    </span>
                  )}
                  {item.label}
                </span>
                {item.shortcut && (
                  <span
                    class="text-[11px] ml-4"
                    style={{
                      color: "var(--color-fg-muted)",
                      "font-family": "'JetBrains Mono', monospace",
                    }}
                  >
                    {item.shortcut}
                  </span>
                )}
              </button>
            )}
          </For>
          <Show when={filtered().length === 0}>
            <div class="px-3 py-4 text-center text-xs" style={{ color: "var(--color-fg-muted)" }}>
              No matching commands
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
}
