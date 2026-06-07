import { tabStore } from "@/stores/tabs";
import { settingsStore } from "@/stores/settings";
import type { Tab as TabType } from "@/types";

export function useTabBar(tabs: () => TabType[]) {
  function handleWheel(e: WheelEvent, el: HTMLElement) {
    if (e.deltaY !== 0) {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }
  }

  function handleDragEnter(e: DragEvent) {
    e.preventDefault();
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    const sourceTabId = e.dataTransfer?.getData("application/rune-tab");
    if (sourceTabId) {
      const currentTabs = tabs();
      const lastTab = currentTabs[currentTabs.length - 1];
      if (lastTab && lastTab.id !== sourceTabId) {
        const result = tabStore.reorderTabs(sourceTabId, lastTab.id);
        if (result.paneCleared === "right") {
          settingsStore.setSplitActive(false);
        }
      }
    }
  }

  function handleTabDragDrop(sourceId: string, targetId: string) {
    const result = tabStore.reorderTabs(sourceId, targetId);
    if (result.paneCleared === "right") {
      settingsStore.setSplitActive(false);
    }
  }

  return {
    handleWheel,
    handleDragEnter,
    handleDragOver,
    handleDrop,
    handleTabDragDrop,
  };
}
