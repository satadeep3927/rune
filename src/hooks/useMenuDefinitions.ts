import { createMemo } from "solid-js";
import type { MenuDefinition } from "@/types";
import { pluginRegistry } from "@/plugins/registry";

interface MenuActions {
  openFolder: () => void;
  newFile: () => void;
  save: () => void;
  saveAll: () => void;
  saveAs: () => void;
  toggleTerminal: () => void;
  closeTab: () => void;
  closeAllTabs: () => void;
  newWindow: () => void;
  closeWindow: () => void;
  toggleSidebar: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomReset: () => void;
  commandPalette: () => void;
  workspaceSearch: () => void;
  find: () => void;
  replace: () => void;
  about: () => void;
}

export function useMenuDefinitions(actions: MenuActions) {
  const menus = createMemo<MenuDefinition[]>(() => {
    const coreMenus: MenuDefinition[] = [
      {
        label: "File",
        items: [
          { label: "New File", accelerator: "Ctrl+N", action: actions.newFile },
          { separator: true, label: "" },
          {
            label: "Open Folder",
            accelerator: "Ctrl+K Ctrl+O",
            action: actions.openFolder,
          },
          { separator: true, label: "" },
          { label: "Save", accelerator: "Ctrl+S", action: actions.save },
          {
            label: "Save All",
            accelerator: "Ctrl+Alt+S",
            action: actions.saveAll,
          },
          {
            label: "Save As",
            accelerator: "Ctrl+Shift+S",
            action: actions.saveAs,
          },
          { separator: true, label: "" },
          {
            label: "Close Tab",
            accelerator: "Ctrl+W",
            action: actions.closeTab,
          },
          { label: "Close All Tabs", action: actions.closeAllTabs },
          { separator: true, label: "" },
          {
            label: "New Window",
            accelerator: "Ctrl+Shift+N",
            action: actions.newWindow,
          },
          {
            label: "Close Window",
            accelerator: "Ctrl+Shift+W",
            action: actions.closeWindow,
          },
        ],
      },
      {
        label: "Edit",
        items: [
          { label: "Find", accelerator: "Ctrl+F", action: actions.find },
          { label: "Replace", accelerator: "Ctrl+H", action: actions.replace },
        ],
      },
      {
        label: "View",
        items: [
          {
            label: "Toggle Sidebar",
            accelerator: "Ctrl+B",
            action: actions.toggleSidebar,
          },
          { separator: true, label: "" },
          { label: "Zoom In", accelerator: "Ctrl+=", action: actions.zoomIn },
          { label: "Zoom Out", accelerator: "Ctrl+-", action: actions.zoomOut },
          {
            label: "Reset Zoom",
            accelerator: "Ctrl+0",
            action: actions.zoomReset,
          },
        ],
      },
      {
        label: "Help",
        items: [{ label: "About Rune Editor", action: actions.about }],
      },
    ];

    const result = [...coreMenus];

    // Merge registered plugin menu items
    for (const reg of pluginRegistry.getAllMenuItems()) {
      const existing = result.find(
        (m) => m.label.toLowerCase() === reg.menu.toLowerCase(),
      );
      if (existing) {
        existing.items.push(reg.item);
      } else {
        const helpIndex = result.findIndex(
          (m) => m.label.toLowerCase() === "help",
        );
        if (helpIndex >= 0) {
          result.splice(helpIndex, 0, {
            label: reg.menu,
            items: [reg.item],
          });
        } else {
          result.push({
            label: reg.menu,
            items: [reg.item],
          });
        }
      }
    }

    return result;
  });

  return { menus };
}
