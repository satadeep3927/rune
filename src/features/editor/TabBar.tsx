import { For, Show, JSX } from "solid-js";
import type { Tab as TabType } from "@/types";
import { Tab } from "./Tab";
import { useTabBar } from "@/hooks/useTabBar";

interface TabBarProps {
  tabs: TabType[];
  activeTabId: string | null;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabContextMenu: (tabId: string, e: MouseEvent) => void;
  trailing?: JSX.Element;
}

export function TabBar(props: TabBarProps) {
  const {
    handleWheel,
    handleDragEnter,
    handleDragOver,
    handleDrop,
    handleTabDragDrop,
  } = useTabBar(() => props.tabs);

  return (
    <Show when={props.tabs.length > 0}>
      <div class="flex items-end h-[32px] shrink-0 w-full bg-[var(--color-tab-bg)] border-b border-[var(--color-border)]">
        <div
          ref={(el) => {
            el.addEventListener("wheel", (e) => handleWheel(e, el), {
              passive: false,
            });
          }}
          class="flex items-end h-full overflow-x-auto flex-1 scrollbar-none"
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <For each={props.tabs}>
            {(tab) => (
              <Tab
                tab={tab}
                isActive={props.activeTabId === tab.id}
                onClick={() => props.onTabClick(tab.id)}
                onClose={(e) => {
                  e.stopPropagation();
                  props.onTabClose(tab.id);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  props.onTabContextMenu(tab.id, e);
                }}
                onDragDrop={handleTabDragDrop}
              />
            )}
          </For>
        </div>
        <Show when={props.trailing}>{props.trailing}</Show>
      </div>
    </Show>
  );
}
