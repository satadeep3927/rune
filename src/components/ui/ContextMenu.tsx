import { Show, For } from "solid-js";
import { Dynamic, Portal } from "solid-js/web";
import * as LucideIcons from "lucide-solid";
import { useAdaptiveMenu } from "@/hooks/useAdaptiveMenu";
import { useContextMenu } from "@/hooks/useContextMenu";

export interface ContextMenuItem {
  label: string;
  action?: () => void;
  separator?: boolean;
  disabled?: boolean;
  icon?: string;
  hint?: string;
}

export interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu(props: ContextMenuProps) {
  let menuRef!: HTMLDivElement;
  const position = useAdaptiveMenu(
    () => props.x,
    () => props.y,
    () => menuRef,
  );

  useContextMenu({ onClose: props.onClose });

  const hasAnyIcon = () =>
    props.items.some((item) => !item.separator && item.icon);

  return (
    <Portal mount={document.body}>
      <div
        ref={menuRef}
        data-context-menu
        class="fixed z-[100] py-1 min-w-[190px] overflow-y-auto overflow-x-hidden"
        style={{
          left: `${position().x}px`,
          top: `${position().y}px`,
          "max-height": `${position().maxHeight}px`,
          opacity: position().ready ? 1 : 0,
          "pointer-events": position().ready ? "auto" : "none",
          background: "var(--color-bg-secondary)",
          border: "1px solid var(--color-border)",
          "border-radius": "6px",
          "box-shadow":
            "0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)",
        }}
      >
        <For each={props.items}>
          {(item) => (
            <Show
              when={!item.separator}
              fallback={
                <div
                  class="my-1 mx-2"
                  style={{ height: "1px", background: "var(--color-border)" }}
                />
              }
            >
              <button
                class="w-full px-3 py-[5px] text-[12px] transition-colors flex items-center justify-between gap-4 text-left border-0"
                style={{
                  color: item.disabled
                    ? "var(--color-fg-muted)"
                    : "var(--color-fg)",
                  background: "transparent",
                  cursor: item.disabled ? "default" : "pointer",
                  font: "inherit",
                }}
                classList={{ "opacity-50": item.disabled }}
                disabled={item.disabled}
                onClick={() => {
                  props.onClose();
                  item.action?.();
                }}
                onMouseEnter={(e) => {
                  if (!item.disabled) {
                    (e.currentTarget as HTMLElement).style.background =
                      "var(--color-menu-hover)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "transparent";
                }}
              >
                <div class="flex items-center gap-2">
                  <Show when={hasAnyIcon()}>
                    <Show
                      when={item.icon}
                      fallback={<span class="w-[14px] h-[14px] shrink-0" />}
                    >
                      <span
                        class="inline-flex items-center justify-center w-[14px] h-[14px] shrink-0"
                        style={{ color: "var(--color-fg-muted)" }}
                      >
                        <Show
                          when={item.icon!.trim().startsWith("<")}
                          fallback={
                            <Show
                              when={
                                LucideIcons[
                                  item.icon! as keyof typeof LucideIcons
                                ]
                              }
                            >
                              {(Icon) => (
                                <Dynamic component={Icon as any} size={14} />
                              )}
                            </Show>
                          }
                        >
                          <div
                            class="w-[14px] h-[14px] flex items-center justify-center svg-icon-wrapper"
                            innerHTML={item.icon}
                          />
                        </Show>
                      </span>
                    </Show>
                  </Show>
                  <span>{item.label}</span>
                </div>
                <Show when={item.hint}>
                  <span class="text-[10px] text-[var(--color-fg-muted)] font-sans">
                    {item.hint}
                  </span>
                </Show>
              </button>
            </Show>
          )}
        </For>
      </div>
    </Portal>
  );
}
