import { createEffect, onCleanup } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { watch } from "@tauri-apps/plugin-fs";
import { tabStore } from "@/stores/tabs";

export function useActiveFileWatcher() {
  const watchers = new Map<string, () => void>();

  createEffect(() => {
    const tabs = tabStore.tabs();
    const currentPaths = new Set<string>();

    tabs.forEach((tab) => {
      if (!tab.filePath) return;
      currentPaths.add(tab.filePath);

      if (tab.diskHash === undefined) {
        invoke<number>("get_file_hash", { path: tab.filePath })
          .then((hash) => tabStore.setTabDiskHash(tab.id, hash))
          .catch(console.error);
      }

      if (!watchers.has(tab.filePath)) {
        // Set a dummy function immediately so we don't start multiple watches concurrently
        watchers.set(tab.filePath, () => {});
        
        let isHandlingEvent = false;
        
        watch(
          tab.filePath,
          async () => {
            if (isHandlingEvent) return;
            
            const currentTab = tabStore.tabs().find((t) => t.id === tab.id);
            if (!currentTab || currentTab.diskHash === undefined) return;

            isHandlingEvent = true;
            try {
              const update = await invoke<[number, string] | null>(
                "check_file_update",
                {
                  path: tab.filePath,
                  knownHash: currentTab.diskHash,
                },
              );

              if (update) {
                const [newHash, newContent] = update;
                tabStore.setTabDiskHash(tab.id, newHash);
                
                if (!currentTab.isDirty) {
                  // Clean: silent auto reload
                  tabStore.updateTabContent(tab.id, newContent);
                  tabStore.markTabClean(tab.id);
                } else {
                  // Dirty: raise conflict
                  tabStore.setTabConflict(tab.id, newContent);
                }
              }
            } catch (e) {
              console.error("Failed to check file update", e);
            } finally {
              isHandlingEvent = false;
            }
          },
          { recursive: false, delayMs: 200 }
        )
          .then((unwatch) => watchers.set(tab.filePath, unwatch))
          .catch((err) => {
            console.warn(`Could not watch file ${tab.filePath}:`, err);
            watchers.delete(tab.filePath);
          });
      }
    });

    for (const [path, unwatch] of watchers.entries()) {
      if (!currentPaths.has(path)) {
        unwatch();
        watchers.delete(path);
      }
    }
  });

  onCleanup(() => {
    for (const unwatch of watchers.values()) {
      unwatch();
    }
    watchers.clear();
  });
}
