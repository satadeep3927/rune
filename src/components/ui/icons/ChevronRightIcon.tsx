import { JSX } from "solid-js";
import { cn } from "@/utils/cn";

export interface ChevronRightIconProps extends JSX.SvgSVGAttributes<SVGSVGElement> {}

export function ChevronRightIcon(props: ChevronRightIconProps) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={cn(props.class)}
      {...props}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
