import { createMemo } from "solid-js";
import type { MenuDefinition } from "../types";

interface MenuActions {
  openFolder: () => void;
  newFile: () => void;
  save: () => void;
  saveAs: () => void;
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
  const menus = createMemo<MenuDefinition[]>(() => [
    {
      label: "File",
      items: [
        { label: "New File", accelerator: "Ctrl+N", action: actions.newFile },
        { separator: true, label: "" },
        { label: "Open Folder", accelerator: "Ctrl+K Ctrl+O", action: actions.openFolder },
        { separator: true, label: "" },
        { label: "Save", accelerator: "Ctrl+S", action: actions.save },
        { label: "Save As", accelerator: "Ctrl+Shift+S", action: actions.saveAs },
        { separator: true, label: "" },
        { label: "Close Tab", accelerator: "Ctrl+W", action: actions.closeTab },
        { label: "Close All Tabs", action: actions.closeAllTabs },
        { separator: true, label: "" },
        { label: "New Window", accelerator: "Ctrl+Shift+N", action: actions.newWindow },
        { label: "Close Window", accelerator: "Ctrl+Shift+W", action: actions.closeWindow },
      ],
    },
    {
      label: "Edit",
      items: [
        { label: "Find", accelerator: "Ctrl+F", action: actions.find },
        { label: "Replace", accelerator: "Ctrl+H", action: actions.replace },
        { separator: true, label: "" },
        { label: "Find in Workspace", accelerator: "Ctrl+Shift+F", action: actions.workspaceSearch },
      ],
    },
    {
      label: "View",
      items: [
        { label: "Command Palette", accelerator: "Ctrl+Shift+P", action: actions.commandPalette },
        { separator: true, label: "" },
        { label: "Toggle Sidebar", accelerator: "Ctrl+B", action: actions.toggleSidebar },
        { separator: true, label: "" },
        { label: "Zoom In", accelerator: "Ctrl+=", action: actions.zoomIn },
        { label: "Zoom Out", accelerator: "Ctrl+-", action: actions.zoomOut },
        { label: "Reset Zoom", accelerator: "Ctrl+0", action: actions.zoomReset },
      ],
    },
    {
      label: "Help",
      items: [{ label: "About Rune Editor", action: actions.about }],
    },
  ]);

  return { menus };
}
