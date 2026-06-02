import { Show, For, onCleanup } from "solid-js";

export interface ContextMenuItem {
  label: string;
  action?: () => void;
  separator?: boolean;
  disabled?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu(props: ContextMenuProps) {
  function handleClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest("[data-context-menu]")) {
      props.onClose();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") props.onClose();
  }

  document.addEventListener("click", handleClickOutside);
  document.addEventListener("keydown", handleKeydown);
  onCleanup(() => {
    document.removeEventListener("click", handleClickOutside);
    document.removeEventListener("keydown", handleKeydown);
  });

  return (
    <div
      data-context-menu
      class="fixed z-[100] py-1 min-w-[180px] overflow-hidden"
      style={{
        left: `${props.x}px`,
        top: `${props.y}px`,
        background: "var(--color-bg-secondary)",
        border: "1px solid var(--color-border)",
        "border-radius": "6px",
        "box-shadow": "0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)",
      }}
    >
      <For each={props.items}>
        {(item) => (
          <Show
            when={!item.separator}
            fallback={
              <div class="my-1 mx-2" style={{ height: "1px", background: "var(--color-border)" }} />
            }
          >
            <button
              class="w-full text-left px-3 py-[5px] text-[12px] transition-colors"
              style={{
                color: item.disabled ? "var(--color-fg-muted)" : "var(--color-fg)",
              }}
              classList={{ "opacity-50 cursor-default": item.disabled }}
              disabled={item.disabled}
              onClick={() => {
                props.onClose();
                item.action?.();
              }}
              onMouseEnter={(e) => {
                if (!item.disabled) {
                  (e.currentTarget as HTMLElement).style.background = "var(--color-menu-hover)";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              {item.label}
            </button>
          </Show>
        )}
      </For>
    </div>
  );
}
