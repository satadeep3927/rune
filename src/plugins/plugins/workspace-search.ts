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

    api.ui.registerTitlebarItem({
      id: "workspace-search-titlebar",
      title: "Workspace Search (Ctrl+Shift+F)",
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
      action: () => api.ui.toggleWorkspaceSearch(),
      priority: 20,
    });
  },
};

export default workspaceSearchPlugin;
