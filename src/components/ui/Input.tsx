import { splitProps, JSX } from "solid-js";
import { cn } from "@/utils/cn";

export interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function Input(props: InputProps) {
  const [local, others] = splitProps(props, ["class", "error"]);

  return (
    <input
      class={cn(
        "flex h-8 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        "bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-fg)] placeholder:text-[var(--color-fg-muted)]",
        "focus-visible:ring-1 focus-visible:ring-[var(--color-accent)] focus-visible:border-[var(--color-accent)]",
        local.error && "border-red-500 focus-visible:ring-red-500",
        local.class,
      )}
      {...others}
    />
  );
}
