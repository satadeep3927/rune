import { JSX } from "solid-js";
import { cn } from "@/utils/cn";

export interface CloseIconProps extends JSX.SvgSVGAttributes<SVGSVGElement> {}

export function CloseIcon(props: CloseIconProps) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      stroke-width="1.2"
      class={cn(props.class)}
      {...props}
    >
      <line x1="0" y1="0" x2="10" y2="10" />
      <line x1="10" y1="0" x2="0" y2="10" />
    </svg>
  );
}
