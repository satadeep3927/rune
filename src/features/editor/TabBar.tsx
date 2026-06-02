import { For, Show } from "solid-js";
import type { Tab as TabType } from "../../types";
import { Tab } from "./Tab";

interface TabBarProps {
  tabs: TabType[];
  activeTabId: string | null;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabContextMenu: (tabId: string, e: MouseEvent) => void;
}

export function TabBar(props: TabBarProps) {
  return (
    <Show when={props.tabs.length > 0}>
      <div
        ref={(el) => {
          el.addEventListener("wheel", (e) => {
            if (e.deltaY !== 0) {
              e.preventDefault();
              el.scrollLeft += e.deltaY;
            }
          }, { passive: false });
        }}
        class="flex items-end h-[32px] shrink-0 overflow-x-auto"
        style={{
          background: "var(--color-tab-bg)",
          "border-bottom": "1px solid var(--color-border)",
          "scrollbar-width": "none",
        }}
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
            />
          )}
        </For>
      </div>
    </Show>
  );
}
