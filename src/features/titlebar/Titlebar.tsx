import { Show, For } from "solid-js";
import { WindowControls } from "./WindowControls";
import { MenuBar } from "./MenuBar";
import type { MenuDefinition } from "@/types";
import { pluginRegistry } from "@/plugins/registry";
import { IndexerProgress } from "./IndexerProgress";
import { BranchPicker } from "@/features/git/BranchPicker";

interface TitlebarProps {
  menus?: MenuDefinition[];
  title?: string;
  fs?: any;
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
      <div class="flex items-center h-full gap-1">
        <Show when={props.menus}>
          <MenuBar menus={props.menus!} />
        </Show>
        <div class="pointer-events-auto no-drag h-full" style={{ "-webkit-app-region": "no-drag" }}>
          <Show when={props.fs}>
            <BranchPicker fs={props.fs} />
          </Show>
        </div>
      </div>

      <div data-tauri-drag-region class="flex-1 h-full" />

      <div
        data-tauri-drag-region
        class="text-[11px] absolute left-1/2 -translate-x-1/2 pointer-events-none flex items-center"
        style={{ color: "var(--color-fg-muted)" }}
      >
        <span>{props.title ?? "Rune Editor"}</span>
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
