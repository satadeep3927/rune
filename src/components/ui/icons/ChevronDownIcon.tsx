import { JSX } from "solid-js";
import { cn } from "@/utils/cn";

export interface ChevronDownIconProps extends JSX.SvgSVGAttributes<SVGSVGElement> {}

export function ChevronDownIcon(props: ChevronDownIconProps) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      class={cn(props.class)}
      {...props}
    >
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  );
}
