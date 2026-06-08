import { splitProps, JSX } from "solid-js";
import { cn } from "@/utils/cn";

export interface TextareaProps extends JSX.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function Textarea(props: TextareaProps) {
  const [local, others] = splitProps(props, ["class", "error"]);

  return (
    <textarea
      class={cn(
        "flex min-h-[40px] w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none",
        "bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-fg)] placeholder:text-[var(--color-fg-muted)]",
        "focus-visible:ring-1 focus-visible:ring-[var(--color-accent)] focus-visible:border-[var(--color-accent)]",
        local.error && "border-red-500 focus-visible:ring-red-500",
        local.class,
      )}
      {...others}
    />
  );
}
