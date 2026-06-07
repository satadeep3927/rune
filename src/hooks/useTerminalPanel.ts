import { createSignal, createUniqueId, onMount } from "solid-js";
import { invoke } from "@tauri-apps/api/core";

export interface TermTab {
  id: string;
  name: string;
}

export function useTerminalPanel(onClose: () => void) {
  const [tabs, setTabs] = createSignal<TermTab[]>([]);
  const [activeTabId, setActiveTabId] = createSignal<string | null>(null);
  const [editingTabId, setEditingTabId] = createSignal<string | null>(null);

  function handleAddTab() {
    const id = createUniqueId();
    const name = "Terminal";
    setTabs((prev) => [...prev, { id, name }]);
    setActiveTabId(id);
  }

  function handleCloseTab(id: string, e?: Event) {
    e?.stopPropagation();
    setTabs((prev) => prev.filter((t) => t.id !== id));
    if (activeTabId() === id) {
      const remaining = tabs();
      if (remaining.length > 0) {
        setActiveTabId(remaining[remaining.length - 1].id);
      } else {
        onClose();
      }
    }
    invoke("kill_terminal", { termId: id }).catch(() => {});
  }

  function handleRenameTab(id: string, newName: string) {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, name: newName || "Terminal" } : t,
      ),
    );
    setEditingTabId(null);
  }

  onMount(() => {
    handleAddTab();
  });

  return {
    tabs,
    activeTabId,
    setActiveTabId,
    editingTabId,
    setEditingTabId,
    handleAddTab,
    handleCloseTab,
    handleRenameTab,
  };
}
