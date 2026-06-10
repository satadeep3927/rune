import { tabStore } from "@/stores/tabs";
import { settingsStore } from "@/stores/settings";
import type { PaneSide } from "@/types";
import type { ContextMenuItem } from "@/components/ui/ContextMenu";

interface TabContextMenuOptions {
  showContextMenu: (x: number, y: number, items: ContextMenuItem[]) => void;
}

export function useTabContextMenu(options: TabContextMenuOptions) {
  const { showContextMenu } = options;

  function handleTabContextMenu(tabId: string, pane: PaneSide, e: MouseEvent) {
    const items: ContextMenuItem[] = [
      {
        label: "Close",
        action: () => {
          const result = tabStore.closeTab(tabId);
          if (result.paneCleared) settingsStore.setSplitActive(false);
        },
      },
      { label: "Close Others", action: () => tabStore.closeOtherTabs(tabId) },
      {
        label: "Close to the Right",
        action: () => tabStore.closeTabsToRight(tabId),
      },
      { separator: true, label: "" },
    ];

    if (pane === "left" && !settingsStore.splitActive()) {
      items.push({
        label: "Move to Right Pane",
        action: () => {
          settingsStore.setSplitActive(true);
          tabStore.moveTabToPane(tabId, "right");
        },
      });
    } else if (pane === "right") {
      items.push({
        label: "Move to Left Pane",
        action: () => {
          const result = tabStore.moveTabToPane(tabId, "left");
          if (result.paneCleared === "right")
            settingsStore.setSplitActive(false);
        },
      });
    } else if (pane === "left" && settingsStore.splitActive()) {
      items.push({
        label: "Move to Right Pane",
        action: () => {
          tabStore.moveTabToPane(tabId, "right");
        },
      });
    }

    items.push(
      { separator: true, label: "" },
      {
        label: "Close All",
        action: () => {
          tabStore.closeAllTabs();
          settingsStore.setSplitActive(false);
        },
      },
    );
    showContextMenu(e.clientX, e.clientY, items);
  }

  return { handleTabContextMenu };
}
