import { JSX } from "solid-js";
import { cn } from "@/utils/cn";

export interface SearchIconProps extends JSX.SvgSVGAttributes<SVGSVGElement> {}

export function SearchIcon(props: SearchIconProps) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={cn(props.class)}
      {...props}
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
