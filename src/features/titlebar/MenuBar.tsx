import { createSignal, For, Show, onCleanup } from "solid-js";
import type { MenuDefinition, MenuItem } from "@/types";

interface MenuBarProps {
  menus: MenuDefinition[];
}

function MenuItemView(props: { item: MenuItem; onClose: () => void }) {
  const [subOpen, setSubOpen] = createSignal(false);
  const hasSubmenu = () => !!props.item.submenu?.length;

  if (props.item.separator) {
    return (
      <div
        class="my-1 mx-2"
        style={{ height: "1px", background: "var(--color-border)" }}
      />
    );
  }

  return (
    <div
      class="relative"
      onMouseEnter={() => hasSubmenu() && setSubOpen(true)}
      onMouseLeave={() => setSubOpen(false)}
    >
      <button
        class="w-full text-left px-4 py-[5px] text-[12px] flex justify-between items-center gap-4 transition-colors"
        style={{
          color: props.item.disabled
            ? "var(--color-fg-muted)"
            : "var(--color-fg)",
        }}
        classList={{ "opacity-50 cursor-default": props.item.disabled }}
        disabled={props.item.disabled}
        onClick={() => {
          if (!hasSubmenu()) {
            props.onClose();
            props.item.action?.();
          }
        }}
        onMouseEnter={(e) => {
          if (!props.item.disabled)
            (e.currentTarget as HTMLElement).style.background =
              "var(--color-menu-hover)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }}
      >
        <span>{props.item.label}</span>
        <span
          style={{ color: "var(--color-fg-muted)" }}
          class="ml-6 text-[10px] flex items-center gap-1"
        >
          {props.item.accelerator && <span>{props.item.accelerator}</span>}
          {hasSubmenu() && <span>▶</span>}
        </span>
      </button>

      {/* Submenu flyout */}
      <Show when={subOpen() && hasSubmenu()}>
        <div
          class="absolute left-full top-0 py-1 z-50 min-w-[220px] max-h-[400px] overflow-y-auto"
          style={{
            background: "var(--color-bg-secondary)",
            border: "1px solid var(--color-border)",
            "box-shadow": "0 4px 12px rgba(0,0,0,0.4)",
          }}
        >
          <For each={props.item.submenu}>
            {(subItem) => (
              <MenuItemView item={subItem} onClose={props.onClose} />
            )}
          </For>
        </div>
      </Show>
    </div>
  );
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
                  {(item) => <MenuItemView item={item} onClose={closeMenus} />}
                </For>
              </div>
            </Show>
          </div>
        )}
      </For>
    </nav>
  );
}
