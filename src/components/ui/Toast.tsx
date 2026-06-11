import { JSX, splitProps, Show } from "solid-js";
import { cn } from "@/utils/cn";
import { X } from "lucide-solid";
import { Button } from "./Button";

export interface ToastProps extends Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  "title"
> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: JSX.Element;
  description?: JSX.Element;
  action?: JSX.Element;
  icon?: JSX.Element;
}

export function Toast(props: ToastProps) {
  const [local, others] = splitProps(props, [
    "class",
    "open",
    "onOpenChange",
    "title",
    "description",
    "action",
    "icon",
  ]);

  return (
    <Show when={local.open !== false}>
      <div
        class={cn(
          "fixed bottom-6 right-6 w-[22rem] z-50 animate-in slide-in-from-bottom-5 fade-in-0 flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 shadow-2xl text-[var(--color-fg)]",
          local.class,
        )}
        {...others}
      >
        <div class="flex items-start justify-between gap-2 border-b border-[var(--color-border)] pb-3 mb-1">
          <div class="flex items-center gap-3">
            <Show when={local.icon}>
              <div class="p-1.5 bg-[var(--color-accent)]/10 rounded-md text-[var(--color-accent)]">
                {local.icon}
              </div>
            </Show>
            <div class="flex flex-col gap-0.5">
              <Show when={local.title}>
                <div class="text-sm font-bold tracking-tight">
                  {local.title}
                </div>
              </Show>
            </div>
          </div>
          <Show when={local.onOpenChange}>
            <Button
              variant="ghost"
              size="icon"
              class="shrink-0"
              onClick={() => local.onOpenChange?.(false)}
            >
              <X size={16} />
            </Button>
          </Show>
        </div>
        <Show when={local.description}>
          <div class="text-sm">{local.description}</div>
        </Show>
        <Show when={local.action}>
          <div class="mt-1 flex items-center justify-end gap-2">
            {local.action}
          </div>
        </Show>
      </div>
    </Show>
  );
}
