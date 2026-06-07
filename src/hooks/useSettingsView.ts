import { createSignal, onMount, createEffect } from "solid-js";
import { loadWorkspaceSettings, workspaceRootPath } from "@/stores/settings";

export function useSettingsView() {
  const [activeTab, setActiveTab] = createSignal<"global" | "workspace">(
    "global",
  );

  onMount(() => {
    if (workspaceRootPath) {
      loadWorkspaceSettings(workspaceRootPath);
    }
  });

  createEffect(() => {
    if (activeTab() === "workspace" && workspaceRootPath) {
      loadWorkspaceSettings(workspaceRootPath);
    }
  });

  return {
    activeTab,
    setActiveTab,
  };
}
