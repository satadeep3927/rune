import { JSX } from "solid-js";
import { cn } from "@/utils/cn";

export interface MaxIconProps extends JSX.SvgSVGAttributes<SVGSVGElement> {}

export function MaxIcon(props: MaxIconProps) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      stroke-width="1"
      class={cn(props.class)}
      {...props}
    >
      <rect x="0.5" y="0.5" width="9" height="9" />
    </svg>
  );
}
