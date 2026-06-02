import { createSignal, For, Show, onCleanup } from "solid-js";
import type { MenuDefinition, MenuItem } from "../../types";

interface MenuBarProps {
  menus: MenuDefinition[];
}

export function MenuBar(props: MenuBarProps) {
  const [openMenu, setOpenMenu] = createSignal<number | null>(null);

  function toggleMenu(index: number) {
    setOpenMenu(openMenu() === index ? null : index);
  }

  function closeMenus() {
    setOpenMenu(null);
  }

  function handleClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest("[data-menu-bar]")) {
      closeMenus();
    }
  }

  document.addEventListener("click", handleClickOutside);
  onCleanup(() => document.removeEventListener("click", handleClickOutside));

  function executeItem(item: MenuItem) {
    closeMenus();
    item.action?.();
  }

  return (
    <nav class="flex shrink-0 h-full items-center" data-menu-bar>
      <For each={props.menus}>
        {(menu, menuIndex) => (
          <div class="relative h-full">
            <button
              class="h-full px-3 text-[12px] tracking-wide transition-colors"
              classList={{
                "bg-[var(--color-menu-hover)]": openMenu() === menuIndex(),
              }}
              style={{
                color:
                  openMenu() === menuIndex()
                    ? "var(--color-fg)"
                    : "var(--color-fg-muted)",
              }}
              onClick={(e) => {
                e.stopPropagation();
                toggleMenu(menuIndex());
              }}
              onMouseEnter={() => {
                if (openMenu() !== null) setOpenMenu(menuIndex());
              }}
            >
              {menu.label}
            </button>

            <Show when={openMenu() === menuIndex()}>
              <div
                class="absolute top-full left-0 py-1 z-50 min-w-[220px]"
                style={{
                  background: "var(--color-bg-secondary)",
                  border: "1px solid var(--color-border)",
                  "border-radius": "0px",
                  "box-shadow": "0 4px 12px rgba(0,0,0,0.4)",
                }}
              >
                <For each={menu.items}>
                  {(item) => (
                    <Show
                      when={!item.separator}
                      fallback={
                        <div
                          class="my-1 mx-2"
                          style={{
                            height: "1px",
                            background: "var(--color-border)",
                          }}
                        />
                      }
                    >
                      <button
                        class="w-full text-left px-4 py-[5px] text-[12px] flex justify-between items-center transition-colors"
                        style={{
                          color: item.disabled
                            ? "var(--color-fg-muted)"
                            : "var(--color-fg)",
                        }}
                        classList={{
                          "opacity-50 cursor-default": item.disabled,
                        }}
                        disabled={item.disabled}
                        onClick={() => executeItem(item)}
                        onMouseEnter={(e) => {
                          if (!item.disabled) {
                            (e.currentTarget as HTMLElement).style.background =
                              "var(--color-menu-hover)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background =
                            "transparent";
                        }}
                      >
                        <span>{item.label}</span>
                        <Show when={item.accelerator}>
                          <span
                            style={{ color: "var(--color-fg-muted)" }}
                            class="ml-6 text-[10px]"
                          >
                            {item.accelerator}
                          </span>
                        </Show>
                      </button>
                    </Show>
                  )}
                </For>
              </div>
            </Show>
          </div>
        )}
      </For>
    </nav>
  );
}
