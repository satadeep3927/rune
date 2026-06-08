import { splitProps, JSX } from "solid-js";
import { cva, type VariantProps } from "cva";
import { cn } from "@/utils/cn";

const buttonVariants = cva({
  base: "inline-flex items-center justify-center rounded-sm text-xs font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
  variants: {
      variant: {
        default:
          "bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[var(--color-fg)]",
        primary:
          "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]",
        secondary:
          "bg-[var(--color-bg-tertiary)] text-[var(--color-fg)] hover:bg-[var(--color-bg-secondary)]",
        ghost:
          "hover:bg-[var(--color-bg-secondary)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] border-none",
        danger: "bg-red-600 text-white hover:bg-red-700",
        link: "text-[var(--color-accent)] underline-offset-4 hover:underline",
      },
      size: {
        default: "px-3 py-1.5",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-8 text-sm",
        icon: "h-5 w-5 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    JSX.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button(props: ButtonProps) {
  const [local, others] = splitProps(props, ["class", "variant", "size"]);
  return (
    <button
      class={cn(
        buttonVariants({ variant: local.variant, size: local.size }),
        local.class,
      )}
      {...others}
    />
  );
}
