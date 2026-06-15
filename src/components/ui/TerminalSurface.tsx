import { splitProps, type JSX } from "solid-js";
import { cn } from "@/utils/cn";
import { settingsStore } from "@/stores/settings";

export interface TerminalSurfaceProps extends Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  "ref"
> {
  active?: boolean;
  terminalRef?: (el: HTMLDivElement) => void;
}

export function TerminalSurface(props: TerminalSurfaceProps) {
  const [local, others] = splitProps(props, ["class", "active", "terminalRef"]);

  const zoom = () => settingsStore.zoomLevel();
  const inverseZoom = () => 1 / zoom();

  return (
    <div
      class={cn("absolute inset-0 overflow-hidden", local.class)}
      style={{
        visibility: local.active ? "visible" : "hidden",
        "pointer-events": local.active ? "auto" : "none",
      }}
    >
      <div
        ref={local.terminalRef}
        style={{
          "transform-origin": "0 0",
          transform: `scale(${inverseZoom()})`,
          width: `${zoom() * 100}%`,
          height: `${zoom() * 100}%`,
        }}
        {...others}
      />
    </div>
  );
}
