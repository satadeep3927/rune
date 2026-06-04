import { createSignal } from "solid-js";
import type { Tab, FileType, PaneSide } from "../types";

let nextTabId = 1;
let untitledCount = 0;

const [tabs, setTabs] = createSignal<Tab[]>([]);
const [activeTabId, setActiveTabId] = createSignal<string | null>(null);
const [rightActiveTabId, setRightActiveTabId] = createSignal<string | null>(
  null,
);
const [focusedPane, setFocusedPane] = createSignal<PaneSide>("left");

const TAB_STORAGE_PREFIX = "rune-tabs-";

function saveTabsToStorage(rootPath: string | null) {
  if (!rootPath) return;
  const current = tabs();
  if (current.length === 0) {
    localStorage.removeItem(TAB_STORAGE_PREFIX + rootPath);
    return;
  }
  const data = {
    tabs: current.map((t) => ({
      filePath: t.filePath,
      fileName: t.fileName,
      language: t.language,
      fileType: t.fileType,
      pane: t.pane,
    })),
    activeFilePath: getActiveTab()?.filePath ?? null,
    rightActiveFilePath: getRightActiveTab()?.filePath ?? null,
  };
  localStorage.setItem(TAB_STORAGE_PREFIX + rootPath, JSON.stringify(data));
}

function loadTabsFromStorage(
  rootPath: string,
): (Tab & { pane: PaneSide })[] | null {
  const raw = localStorage.getItem(TAB_STORAGE_PREFIX + rootPath);
  if (!raw) return null;
  try {
    return JSON.parse(raw).tabs;
  } catch {
    return null;
  }
}

function getStoredActiveFilePath(rootPath: string): string | null {
  const raw = localStorage.getItem(TAB_STORAGE_PREFIX + rootPath);
  if (!raw) return null;
  try {
    return JSON.parse(raw).activeFilePath;
  } catch {
    return null;
  }
}

function getStoredRightActiveFilePath(rootPath: string): string | null {
  const raw = localStorage.getItem(TAB_STORAGE_PREFIX + rootPath);
  if (!raw) return null;
  try {
    return JSON.parse(raw).rightActiveFilePath;
  } catch {
    return null;
  }
}

function openTab(
  filePath: string,
  fileName: string,
  content: string,
  language: string,
  fileType: FileType = "text",
  dataUrl?: string,
  pane: PaneSide = "left",
): string {
  const existing = tabs().find((t) => t.filePath === filePath);
  if (existing) {
    if (existing.pane === "left") setActiveTabId(existing.id);
    else setRightActiveTabId(existing.id);
    return existing.id;
  }

  const id = `tab-${nextTabId++}`;
  const tab: Tab = {
    id,
    filePath,
    fileName,
    content,
    savedContent: content.replace(/\r\n/g, "\n"),
    language,
    isDirty: false,
    fileType,
    dataUrl,
    pane,
  };

  setTabs((prev) => [...prev, tab]);
  if (pane === "left") setActiveTabId(id);
  else setRightActiveTabId(id);
  return id;
}

function openUntitledTab(): string {
  untitledCount++;
  const id = `tab-${nextTabId++}`;
  const fileName = `Untitled-${untitledCount}`;
  const tab: Tab = {
    id,
    filePath: "",
    fileName,
    content: "",
    savedContent: "",
    language: "text",
    isDirty: false,
    fileType: "text",
    pane: "left",
  };
  setTabs((prev) => [...prev, tab]);
  setActiveTabId(id);
  return id;
}

function closeTab(tabId: string): { paneCleared?: PaneSide } {
  const tab = tabs().find((t) => t.id === tabId);
  if (!tab) return {};

  const currentTabs = tabs();
  setTabs((prev) => prev.filter((t) => t.id !== tabId));

  const paneRemaining = currentTabs.filter(
    (t) => t.id !== tabId && t.pane === tab.pane,
  );
  let paneCleared: PaneSide | undefined;
  if (paneRemaining.length === 0) paneCleared = tab.pane;

  if (tab.pane === "left" && activeTabId() === tabId) {
    if (paneRemaining.length > 0) {
      const paneLocalIndex = currentTabs
        .filter((t) => t.pane === "left")
        .findIndex((t) => t.id === tabId);
      const newIndex = Math.min(paneLocalIndex, paneRemaining.length - 1);
      setActiveTabId(paneRemaining[newIndex].id);
    } else {
      setActiveTabId(null);
    }
  } else if (tab.pane === "right" && rightActiveTabId() === tabId) {
    if (paneRemaining.length > 0) {
      const paneLocalIndex = currentTabs
        .filter((t) => t.pane === "right")
        .findIndex((t) => t.id === tabId);
      const newIndex = Math.min(paneLocalIndex, paneRemaining.length - 1);
      setRightActiveTabId(paneRemaining[newIndex].id);
    } else {
      setRightActiveTabId(null);
    }
  }

  return { paneCleared };
}

function updateTabContent(tabId: string, content: string) {
  const normalized = content.replace(/\r\n/g, "\n");
  setTabs((prev) =>
    prev.map((t) => {
      if (t.id !== tabId) return t;
      return {
        ...t,
        content: normalized,
        isDirty: normalized !== t.savedContent,
      };
    }),
  );
}

function markTabClean(tabId: string) {
  setTabs((prev) =>
    prev.map((t) =>
      t.id === tabId
        ? {
            ...t,
            isDirty: false,
            savedContent: t.content.replace(/\r\n/g, "\n"),
          }
        : t,
    ),
  );
}

function getActiveTab(): Tab | undefined {
  const id = activeTabId();
  return id ? tabs().find((t) => t.id === id && t.pane === "left") : undefined;
}

function getRightActiveTab(): Tab | undefined {
  const id = rightActiveTabId();
  return id ? tabs().find((t) => t.id === id && t.pane === "right") : undefined;
}

function getFocusedTab(): Tab | undefined {
  return focusedPane() === "right" ? getRightActiveTab() : getActiveTab();
}

function setActiveTab(tabId: string) {
  const tab = tabs().find((t) => t.id === tabId);
  if (!tab) return;
  if (tab.pane === "left") setActiveTabId(tabId);
  else setRightActiveTabId(tabId);
}

function setActiveTabForPane(tabId: string, pane: PaneSide) {
  if (pane === "left") setActiveTabId(tabId);
  else setRightActiveTabId(tabId);
  setFocusedPane(pane);
}

function updateTabAfterSave(tabId: string, filePath: string, fileName: string) {
  setTabs((prev) =>
    prev.map((t) =>
      t.id === tabId
        ? {
            ...t,
            filePath,
            fileName,
            savedContent: t.content.replace(/\r\n/g, "\n"),
            isDirty: false,
          }
        : t,
    ),
  );
}

function reorderTabs(sourceTabId: string, targetTabId: string) {
  if (sourceTabId === targetTabId) return;
  setTabs((prev) => {
    const sourceIndex = prev.findIndex((t) => t.id === sourceTabId);
    const targetIndex = prev.findIndex((t) => t.id === targetTabId);
    if (sourceIndex === -1 || targetIndex === -1) return prev;

    const sourceTab = prev[sourceIndex];
    const targetTab = prev[targetIndex];
    
    const newTabs = [...prev];
    newTabs.splice(sourceIndex, 1);
    
    const updatedSource = { ...sourceTab, pane: targetTab.pane };
    const insertIndex = sourceIndex < targetIndex ? targetIndex : targetIndex;
    
    newTabs.splice(insertIndex, 0, updatedSource);
    return newTabs;
  });

  const tab = tabs().find((t) => t.id === sourceTabId);
  if (tab) {
    if (tab.pane === "left") {
      setActiveTabId(tab.id);
      setFocusedPane("left");
      if (rightActiveTabId() === tab.id) {
        const rTabs = tabs().filter((t) => t.pane === "right");
        setRightActiveTabId(rTabs[rTabs.length - 1]?.id ?? null);
      }
    } else {
      setRightActiveTabId(tab.id);
      setFocusedPane("right");
      if (activeTabId() === tab.id) {
        const lTabs = tabs().filter((t) => t.pane === "left");
        setActiveTabId(lTabs[lTabs.length - 1]?.id ?? null);
      }
    }
  }
}

function moveTabToPane(tabId: string, targetPane: PaneSide) {
  const tabToMove = tabs().find((t) => t.id === tabId);
  if (!tabToMove || tabToMove.pane === targetPane) return;

  setTabs((prev) =>
    prev.map((t) => (t.id === tabId ? { ...t, pane: targetPane } : t)),
  );

  if (targetPane === "left") {
    setActiveTabId(tabId);
    setFocusedPane("left");
    if (rightActiveTabId() === tabId) {
      const rightTabs = tabs().filter((t) => t.pane === "right");
      setRightActiveTabId(rightTabs[rightTabs.length - 1]?.id ?? null);
    }
  } else {
    setRightActiveTabId(tabId);
    setFocusedPane("right");
    if (activeTabId() === tabId) {
      const leftTabs = tabs().filter((t) => t.pane === "left");
      setActiveTabId(leftTabs[leftTabs.length - 1]?.id ?? null);
    }
  }
}

function closeOtherTabs(keepTabId: string) {
  const tab = tabs().find((t) => t.id === keepTabId);
  if (!tab) return;
  setTabs((prev) => prev.filter((t) => t.id === keepTabId));
  if (tab.pane === "left") setActiveTabId(keepTabId);
  else setRightActiveTabId(keepTabId);
}

function closeTabsToRight(tabId: string) {
  const currentTabs = tabs();
  const index = currentTabs.findIndex((t) => t.id === tabId);
  if (index === -1) return;
  const tab = currentTabs[index]!;
  const paneTabs = currentTabs.filter((t) => t.pane === tab.pane);
  const paneIndex = paneTabs.findIndex((t) => t.id === tabId);
  const keptPaneTabs = paneTabs.slice(0, paneIndex + 1);
  const otherPaneTabs = currentTabs.filter((t) => t.pane !== tab.pane);
  const kept = [...keptPaneTabs, ...otherPaneTabs];
  setTabs(kept);
  if (tab.pane === "left" && !kept.find((t) => t.id === activeTabId())) {
    setActiveTabId(keptPaneTabs[keptPaneTabs.length - 1]?.id ?? null);
  } else if (
    tab.pane === "right" &&
    !kept.find((t) => t.id === rightActiveTabId())
  ) {
    setRightActiveTabId(keptPaneTabs[keptPaneTabs.length - 1]?.id ?? null);
  }
}

function closeAllTabs() {
  setTabs([]);
  setActiveTabId(null);
  setRightActiveTabId(null);
}

function closeTabsForPath(deletedPath: string) {
  const normDeleted = deletedPath.replace(/\\/g, "/");
  const tabsToClose = tabs().filter((t) => {
    if (!t.filePath) return false;
    const normTabPath = t.filePath.replace(/\\/g, "/");
    return (
      normTabPath === normDeleted || normTabPath.startsWith(normDeleted + "/")
    );
  });

  for (const t of tabsToClose) {
    closeTab(t.id);
  }
}

function clearAll() {
  setTabs([]);
  setActiveTabId(null);
  setRightActiveTabId(null);
  untitledCount = 0;
}

function leftTabs(): Tab[] {
  return tabs().filter((t) => t.pane === "left");
}

function rightTabs(): Tab[] {
  return tabs().filter((t) => t.pane === "right");
}

export const tabStore = {
  tabs,
  activeTabId,
  rightActiveTabId,
  focusedPane,
  setFocusedPane,
  openTab,
  openUntitledTab,
  updateTabAfterSave,
  closeTab,
  closeOtherTabs,
  moveTabToPane,
  reorderTabs,
  closeTabsToRight,
  closeAllTabs,
  closeTabsForPath,
  clearAll,
  updateTabContent,
  markTabClean,
  getActiveTab,
  getRightActiveTab,
  getFocusedTab,
  setActiveTab,
  setActiveTabForPane,
  leftTabs,
  rightTabs,
  saveTabsToStorage,
  loadTabsFromStorage,
  getStoredActiveFilePath,
  getStoredRightActiveFilePath,
};
