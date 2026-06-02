import { Show } from "solid-js";
import { WindowControls } from "./WindowControls";
import { MenuBar } from "./MenuBar";
import type { MenuDefinition } from "../../types";

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

      <WindowControls />
    </header>
  );
}
