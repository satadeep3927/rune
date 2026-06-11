import { For, Show } from "solid-js";
import { MoreHorizontal } from "lucide-solid";
import type { SidebarTab } from "@/hooks/useSidebar";
import { useActivityBar } from "@/hooks/useActivityBar";
import { Button } from "@/components/ui/Button";

interface ActivityBarProps {
  activeTab: SidebarTab;
  onSwitchTab: (tab: SidebarTab) => void;
  width: number;
}

export function ActivityBar(props: ActivityBarProps) {
  const {
    showDropdown,
    setShowDropdown,
    visibleItems,
    hiddenItems,
    setContainerRef,
  } = useActivityBar(() => props.width);

  return (
    <div
      ref={setContainerRef}
      class="flex items-center h-[30px] shrink-0 select-none relative"
      style={{ background: "var(--color-bg-secondary)" }}
    >
      <div class="flex items-center h-full w-full">
        <For each={visibleItems()}>
          {(item) => (
            <Button
              variant="ghost"
              class="flex items-center gap-1.5 px-3 h-full rounded-none transition-colors text-[12px] font-semibold tracking-wide border-0 outline-none shrink-0"
              style={{
                background:
                  item.isTab && props.activeTab === item.id
                    ? "rgba(150, 150, 150, 0.15)"
                    : "transparent",
                color:
                  item.isTab && props.activeTab === item.id
                    ? "var(--color-fg)"
                    : "var(--color-fg-muted)",
              }}
              onClick={() => {
                if (item.isTab) {
                  props.onSwitchTab(item.id as SidebarTab);
                } else if (item.action) {
                  item.action();
                }
              }}
              title={item.label}
            >
              <Show
                when={item.iconLucide}
                fallback={
                  <span
                    innerHTML={item.iconSvg!}
                    class="flex items-center justify-center svg-icon-wrapper"
                    style={{
                      width: "14px",
                      height: "14px",
                      color: "currentColor",
                    }}
                  />
                }
              >
                {item.iconLucide && <item.iconLucide size={14} />}
              </Show>
              <span>{item.label}</span>
            </Button>
          )}
        </For>

        <Show when={hiddenItems().length > 0}>
          <Button
            variant="ghost"
            class="flex items-center justify-center px-2 h-full rounded-none transition-colors text-xs"
            style={{
              background: showDropdown()
                ? "var(--color-sidebar-bg)"
                : "transparent",
              color: showDropdown()
                ? "var(--color-fg)"
                : "var(--color-fg-muted)",
              outline: "none",
            }}
            onClick={() => setShowDropdown(!showDropdown())}
          >
            <MoreHorizontal size={14} />
          </Button>
        </Show>
      </div>

      <Show when={showDropdown()}>
        <div
          class="absolute left-0 top-[30px] py-1 z-50 flex flex-col"
          style={{
            background: "var(--color-bg-secondary)",
            border: "1px solid var(--color-border)",
            "border-radius": "0 0 6px 6px",
            "box-shadow": "0 4px 12px rgba(0, 0, 0, 0.2)",
            "min-width": "140px",
          }}
        >
          <For each={hiddenItems()}>
            {(item) => (
              <Button
                variant="ghost"
                class="flex items-center justify-start gap-2 px-3 py-2 text-[12px] rounded-none font-medium text-left w-full outline-none"
                style={{
                  color:
                    item.isTab && props.activeTab === item.id
                      ? "var(--color-accent)"
                      : "var(--color-fg)",
                }}
                onClick={() => {
                  if (item.isTab) {
                    props.onSwitchTab(item.id as SidebarTab);
                  } else if (item.action) {
                    item.action();
                  }
                  setShowDropdown(false);
                }}
              >
                <Show
                  when={item.iconLucide}
                  fallback={
                    <span
                      innerHTML={item.iconSvg!}
                      class="flex items-center justify-center svg-icon-wrapper"
                      style={{
                        width: "14px",
                        height: "14px",
                        color: "currentColor",
                      }}
                    />
                  }
                >
                  {item.iconLucide && <item.iconLucide size={14} />}
                </Show>
                <span>{item.label}</span>
              </Button>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
