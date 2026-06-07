import { JSX } from "solid-js";
import { cn } from "@/utils/cn";

export interface TerminalIconProps extends JSX.SvgSVGAttributes<SVGSVGElement> {}

export function TerminalIcon(props: TerminalIconProps) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      class={cn(props.class)}
      {...props}
    >
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}
