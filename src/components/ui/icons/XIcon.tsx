import { JSX } from "solid-js";
import { cn } from "@/utils/cn";

export interface XIconProps extends JSX.SvgSVGAttributes<SVGSVGElement> {}

export function XIcon(props: XIconProps) {
  return (
    <svg
      width="8"
      height="8"
      viewBox="0 0 8 8"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      class={cn(props.class)}
      {...props}
    >
      <line x1="1" y1="1" x2="7" y2="7" />
      <line x1="7" y1="1" x2="1" y2="7" />
    </svg>
  );
}
