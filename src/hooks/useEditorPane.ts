import { tabStore } from "@/stores/tabs";
import { settingsStore } from "@/stores/settings";
import type { PaneSide } from "@/types";

export function useEditorPane(pane: PaneSide) {
  const currentTabs = () =>
    pane === "left" ? tabStore.leftTabs() : tabStore.rightTabs();

  const activeTabId = () =>
    pane === "left" ? tabStore.activeTabId() : tabStore.rightActiveTabId();

  const activeTab = () =>
    pane === "left" ? tabStore.getActiveTab() : tabStore.getRightActiveTab();

  const widthStyle = () => {
    if (pane === "left") {
      return settingsStore.splitActive()
        ? `${settingsStore.splitWidth()}%`
        : "100%";
    }
    return `${100 - settingsStore.splitWidth()}%`;
  };

  const handleTabClick = (id: string) => {
    tabStore.setActiveTabForPane(id, pane);
  };

  const handleTabClose = (id: string) => {
    const result = tabStore.closeTab(id);
    if (pane === "left") {
      if (result.paneCleared === "left" && !tabStore.rightTabs().length) {
        settingsStore.setSplitActive(false);
      }
    } else {
      if (result.paneCleared === "right") {
        settingsStore.setSplitActive(false);
      }
    }
  };

  return {
    currentTabs,
    activeTabId,
    activeTab,
    widthStyle,
    handleTabClick,
    handleTabClose,
  };
}
