import { createEffect } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { tabStore } from "../stores/tabs";
import {
  settingsStore,
  workspaceSettings,
  loadWorkspaceSettings,
} from "../stores/settings";

interface WorkspaceSyncOptions {
  fs: any;
}

export function useWorkspaceSync(options: WorkspaceSyncOptions) {
  const { fs } = options;
  let previousRoot: string | null = null;
  let workspaceReady = false;

  // Auto-save tabs to storage whenever they change
  createEffect(() => {
    // Track dependencies
    tabStore.tabs();
    tabStore.getActiveTab();
    tabStore.getRightActiveTab();
    
    if (fs.rootPath() && workspaceReady) {
      tabStore.saveTabsToStorage(fs.rootPath());
    }
  });

  // Watch for exclude items changes
  createEffect(() => {
    workspaceSettings.excludeItems;
    if (fs.rootPath() && workspaceReady) {
      fs.refreshTree();
    }
  });

  // Watch for workspace root changes
  createEffect(() => {
    const root = fs.rootPath();
    if (root === previousRoot) return;

    if (previousRoot) {
      tabStore.saveTabsToStorage(previousRoot);
    }

    tabStore.clearAll();
    previousRoot = root;

    if (root) {
      loadWorkspaceSettings(root).then(() => {
        workspaceReady = true;
        invoke("index_workspace", { workspacePath: root }).catch(console.error);

        const stored = tabStore.loadTabsFromStorage(root);
        if (stored) {
          const activePath = tabStore.getStoredActiveFilePath(root);
          const rightActivePath = tabStore.getStoredRightActiveFilePath(root);

          (async () => {
            const results = await Promise.allSettled(
              stored.map(async (t) => {
                const { content, language, fileType } =
                  await fs.readFileContent(t.filePath);
                const dataUrl =
                  fileType === "image" || fileType === "pdf"
                    ? content
                    : undefined;
                const tabContent =
                  fileType === "image" || fileType === "pdf" ? "" : content;
                return {
                  ...t,
                  content: tabContent,
                  language,
                  fileType,
                  dataUrl,
                };
              }),
            );
            for (const result of results) {
              if (result.status === "fulfilled") {
                const t = result.value;
                tabStore.openTab(
                  t.filePath,
                  t.fileName,
                  t.content,
                  t.language,
                  t.fileType,
                  t.dataUrl,
                  t.pane,
                );
              }
            }

            if (activePath) {
              const match = tabStore
                .tabs()
                .find((t) => t.filePath === activePath);
              if (match) tabStore.setActiveTabForPane(match.id, "left");
            }
            if (rightActivePath) {
              const match = tabStore
                .tabs()
                .find((t) => t.filePath === rightActivePath);
              if (match) {
                tabStore.setActiveTabForPane(match.id, "right");
                settingsStore.setSplitActive(true);
              }
            }
          })();
        }
      });
    }
  });
}
