import type { RunePlugin, RuneAPI } from "@/plugins/types";

const terminalPlugin: RunePlugin = {
  id: "terminal",
  name: "Terminal Panel",
  version: "1.0.0",
  type: "builtin",
  permissions: [],

  activate(api: RuneAPI) {
    api.ui.registerCommand({
      id: "view.toggle-terminal",
      label: "Toggle Terminal",
      shortcut: "Ctrl+`",
      category: "View",
      action: () => {
        api.ui.toggleTerminal();
      },
    });

    api.ui.registerMenuItem({
      menu: "View",
      item: {
        label: "Toggle Terminal",
        accelerator: "Ctrl+`",
        action: () => api.ui.toggleTerminal(),
      },
      priority: 20,
    });

    api.ui.registerExplorerToolbarItem({
      id: "terminal-explorer-button",
      title: "Toggle Integrated Terminal",
      label: "Terminal",
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-terminal"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>',
      action: () => api.ui.toggleTerminal(),
      priority: 20,
    });
  },
};

export default terminalPlugin;
