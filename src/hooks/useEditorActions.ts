import { tabStore } from "@/stores/tabs";
import { settingsStore, loadWorkspaceSettings } from "@/stores/settings";

interface EditorActionsOptions {
  fs: any;
}

export function useEditorActions(options: EditorActionsOptions) {
  const { fs } = options;

  async function handleSave() {
    const tab = tabStore.getFocusedTab();
    if (!tab || !tab.isDirty) return;

    if (!tab.filePath || tab.filePath.startsWith("rune://")) {
      await handleSaveAs();
      return;
    }

    try {
      await fs.writeFileContent(tab.filePath, tab.content);
      tabStore.markTabClean(tab.id);
      if (tab.filePath.replace(/\\/g, "/").endsWith(".rune/settings.json")) {
        loadWorkspaceSettings(fs.rootPath());
      }
    } catch (err) {
      console.error("Failed to save file:", err);
    }
  }

  async function handleSaveAll() {
    const dirtyTabs = tabStore
      .tabs()
      .filter(
        (t) => t.isDirty && t.filePath && !t.filePath.startsWith("rune://"),
      );
    for (const tab of dirtyTabs) {
      try {
        await fs.writeFileContent(tab.filePath, tab.content);
        tabStore.markTabClean(tab.id);
        if (tab.filePath.replace(/\\/g, "/").endsWith(".rune/settings.json")) {
          loadWorkspaceSettings(fs.rootPath());
        }
      } catch (err) {
        console.error("Failed to save:", tab.fileName, err);
      }
    }
  }

  async function handleSaveAs() {
    const tab = tabStore.getFocusedTab();
    if (!tab) return;

    const { save } = await import("@tauri-apps/plugin-dialog");
    const path = await save({
      defaultPath: tab.filePath || undefined,
      title: "Save As",
    });
    if (!path || typeof path !== "string") return;

    const name = path.split(/[\\/]/).pop() ?? "Untitled";
    try {
      await fs.writeFileContent(path, tab.content);
      tabStore.updateTabAfterSave(tab.id, path, name);
      if (path.replace(/\\/g, "/").endsWith(".rune/settings.json")) {
        loadWorkspaceSettings(fs.rootPath());
      }
    } catch (err) {
      console.error("Failed to save file:", err);
    }
  }

  function handleCloseTab() {
    const tab = tabStore.getFocusedTab();
    if (tab) {
      const result = tabStore.closeTab(tab.id);
      if (result.paneCleared) {
        settingsStore.setSplitActive(false);
      }
    }
  }

  function triggerEditorCommand(key: string) {
    if (key === "f" || key === "h") {
      window.dispatchEvent(
        new CustomEvent("rune-editor-find", {
          detail: { replace: key === "h" },
        }),
      );
    }
  }

  return {
    handleSave,
    handleSaveAll,
    handleSaveAs,
    handleCloseTab,
    triggerEditorCommand,
  };
}
