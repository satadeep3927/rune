import type { RunePlugin, RuneAPI } from "@/plugins/types";

const commandPalettePlugin: RunePlugin = {
  id: "command-palette",
  name: "Command Palette",
  version: "1.0.0",
  type: "builtin",
  permissions: [],

  activate(api: RuneAPI) {
    api.ui.registerCommand({
      id: "ui.command-palette",
      label: "Command Palette",
      shortcut: "Ctrl+Shift+P",
      category: "View",
      action: () => {
        api.ui.toggleCommandPalette();
      },
    });

    api.ui.registerMenuItem({
      menu: "View",
      item: {
        label: "Command Palette",
        accelerator: "Ctrl+Shift+P",
        action: () => {
          api.ui.toggleCommandPalette();
        },
      },
      priority: 10,
    });
  },
};

export default commandPalettePlugin;
