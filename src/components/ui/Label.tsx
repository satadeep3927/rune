import { splitProps, JSX } from "solid-js";
import { cn } from "@/utils/cn";

export interface LabelProps extends JSX.LabelHTMLAttributes<HTMLLabelElement> {}

export function Label(props: LabelProps) {
  const [local, others] = splitProps(props, ["class"]);

  return (
    <label
      class={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-[var(--color-fg)]",
        local.class,
      )}
      {...others}
    />
  );
}
