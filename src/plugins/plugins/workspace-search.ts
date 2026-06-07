import type { RunePlugin, RuneAPI } from "@/plugins/types";

const workspaceSearchPlugin: RunePlugin = {
  id: "workspace-search",
  name: "Workspace Search",
  version: "1.0.0",
  type: "builtin",
  permissions: [],

  activate(api: RuneAPI) {
    api.ui.registerCommand({
      id: "search.workspace",
      label: "Find in Workspace",
      shortcut: "Ctrl+Shift+F",
      category: "Search",
      action: () => {
        api.ui.toggleWorkspaceSearch();
      },
    });

    api.ui.registerMenuItem({
      menu: "Edit",
      item: {
        label: "Find in Workspace",
        accelerator: "Ctrl+Shift+F",
        action: () => {
          api.ui.toggleWorkspaceSearch();
        },
      },
      priority: 20,
    });
  },
};

export default workspaceSearchPlugin;
