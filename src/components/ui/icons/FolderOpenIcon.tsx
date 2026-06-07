import { JSX } from "solid-js";
import { cn } from "@/utils/cn";

export interface FolderOpenIconProps extends JSX.SvgSVGAttributes<SVGSVGElement> {}

export function FolderOpenIcon(props: FolderOpenIconProps) {
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
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}
