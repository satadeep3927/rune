import { Show, For } from "solid-js";
import { WindowControls } from "./WindowControls";
import { MenuBar } from "./MenuBar";
import type { MenuDefinition } from "@/types";
import { pluginRegistry } from "@/plugins/registry";
import { IndexerProgress } from "./IndexerProgress";

interface TitlebarProps {
  menus?: MenuDefinition[];
  title?: string;
}

export function Titlebar(props: TitlebarProps) {
  return (
    <header
      class="flex items-center h-[30px] select-none shrink-0"
      style={{
        background: "var(--color-titlebar-bg)",
        "border-bottom": "1px solid var(--color-border)",
      }}
    >
      <Show when={props.menus}>
        <MenuBar menus={props.menus!} />
      </Show>

      <div data-tauri-drag-region class="flex-1 h-full" />

      <div
        data-tauri-drag-region
        class="text-[11px] absolute left-1/2 -translate-x-1/2 pointer-events-none"
        style={{ color: "var(--color-fg-muted)" }}
      >
        {props.title ?? "Rune Editor"}
      </div>

      <div
        class="flex items-center h-full no-drag"
        style={{ "-webkit-app-region": "no-drag" }}
      >
        <IndexerProgress />
        <For each={pluginRegistry.getTitlebarItems()}>
          {(item) => (
            <button
              class="h-full px-2 hover:bg-[var(--color-bg-secondary)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition-colors flex items-center justify-center"
              onClick={item.action}
              title={item.title}
            >
              <span
                innerHTML={item.icon}
                class="flex items-center justify-center svg-icon-wrapper"
                style={{ width: "14px", height: "14px" }}
              />
            </button>
          )}
        </For>
      </div>

      <WindowControls />
    </header>
  );
}
