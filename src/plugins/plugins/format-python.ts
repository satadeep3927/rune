import type { RunePlugin, RuneAPI, ContextInfo } from "@/plugins/types";

async function formatFile(api: RuneAPI, filePath: string) {
  try {
    const result = await api.process.exec("ruff", ["format", filePath]);
    if (result.exitCode !== 0) {
      console.error(
        "[format-python] ruff failed:",
        result.stderr || `exit code ${result.exitCode}`,
      );
      return;
    }
    await api.editor.refresh(filePath);
  } catch (err) {
    console.error("[format-python] error:", err);
  }
}

async function formatWorkspace(api: RuneAPI) {
  const root = api.workspace.rootPath();
  if (!root) return;
  try {
    const result = await api.process.exec("ruff", ["format", root]);
    if (result.exitCode !== 0) {
      console.error(
        "[format-python] ruff workspace failed:",
        result.stderr || `exit code ${result.exitCode}`,
      );
      return;
    }
    // Refresh all open Python tabs
    const tabs = (await import("@/stores/tabs")).tabStore.tabs();
    for (const tab of tabs) {
      if (tab.filePath.endsWith(".py")) {
        await api.editor.refresh(tab.filePath);
      }
    }
  } catch (err) {
    console.error("[format-python] workspace error:", err);
  }
}

const formatPythonPlugin: RunePlugin = {
  id: "format-python",
  name: "Python Formatter",
  version: "1.0.0",
  type: "builtin",
  permissions: ["fs.read", "fs.write", "process.exec"],

  activate(api: RuneAPI) {
    // File tree context menu
    api.ui.registerContextMenuItem({
      id: "format-python-file-tree",
      label: "Format File",
      context: "file-tree",
      when: (ctx: ContextInfo) => ctx.entry?.name.endsWith(".py") ?? false,
      priority: 5,
      icon: "RefreshCw",
      hint: "Alt+Shift+F",
      action: async (ctx: ContextInfo) => {
        if (ctx.entry) await formatFile(api, ctx.entry.path);
      },
    });

    // Editor context menu
    api.ui.registerContextMenuItem({
      id: "format-python-editor",
      label: "Format File",
      context: "editor",
      when: (ctx: ContextInfo) => ctx.language === "python" && !!ctx.filePath,
      priority: 5,
      icon: "RefreshCw",
      hint: "Alt+Shift+F",
      action: async (ctx: ContextInfo) => {
        if (ctx.filePath) await formatFile(api, ctx.filePath);
      },
    });

    // Commands
    api.ui.registerCommand({
      id: "ruff.format-file",
      label: "Format Current File",
      shortcut: "Alt+Shift+F",
      category: "Ruff",
      action: async () => {
        const path = api.editor.getActiveFilePath();
        if (path) await formatFile(api, path);
      },
    });

    api.ui.registerCommand({
      id: "ruff.format-workspace",
      label: "Format Workspace",
      category: "Ruff",
      action: () => formatWorkspace(api),
    });
  },
};

export default formatPythonPlugin;
