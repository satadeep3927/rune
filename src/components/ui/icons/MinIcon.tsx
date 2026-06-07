import { JSX } from "solid-js";
import { cn } from "@/utils/cn";

export interface MinIconProps extends JSX.SvgSVGAttributes<SVGSVGElement> {}

export function MinIcon(props: MinIconProps) {
  return (
    <svg
      width="10"
      height="1"
      viewBox="0 0 10 1"
      fill="currentColor"
      class={cn(props.class)}
      {...props}
    >
      <rect width="10" height="1" />
    </svg>
  );
}
