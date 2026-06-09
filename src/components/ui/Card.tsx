import { JSX, splitProps } from "solid-js";
import { cn } from "@/utils/cn";

export interface CardProps extends JSX.HTMLAttributes<HTMLDivElement> {}

export function Card(props: CardProps) {
  const [local, others] = splitProps(props, ["class", "children"]);
  return (
    <div
      class={cn(
        "rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-fg)] shadow-2xl",
        local.class
      )}
      {...others}
    >
      {local.children}
    </div>
  );
}

export function CardHeader(props: CardProps) {
  const [local, others] = splitProps(props, ["class", "children"]);
  return (
    <div
      class={cn("flex flex-col space-y-1.5 p-5 pb-3 border-b border-[var(--color-border)]", local.class)}
      {...others}
    >
      {local.children}
    </div>
  );
}

export function CardTitle(props: JSX.HTMLAttributes<HTMLHeadingElement>) {
  const [local, others] = splitProps(props, ["class", "children"]);
  return (
    <h3
      class={cn("font-bold tracking-tight text-[var(--color-fg)] flex items-center gap-2", local.class)}
      {...others}
    >
      {local.children}
    </h3>
  );
}

export function CardContent(props: CardProps) {
  const [local, others] = splitProps(props, ["class", "children"]);
  return (
    <div class={cn("p-5 pt-4", local.class)} {...others}>
      {local.children}
    </div>
  );
}

export function CardFooter(props: CardProps) {
  const [local, others] = splitProps(props, ["class", "children"]);
  return (
    <div
      class={cn("flex items-center p-5 pt-0", local.class)}
      {...others}
    >
      {local.children}
    </div>
  );
}
