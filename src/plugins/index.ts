import type { RunePlugin } from "./types";
import { createRuneAPI, type RuneAPIOptions } from "./api";
import { pluginRegistry } from "./registry";

import formatPythonPlugin from "./plugins/format-python";
import terminalPlugin from "./plugins/terminal";
import workspaceSearchPlugin from "./plugins/workspace-search";
import commandPalettePlugin from "./plugins/command-palette";
import sampleThemeIconPlugin from "./plugins/sample-theme-icon";
import fileIconsPlugin from "./plugins/file-icons";
import coreRunCode from "./plugins/run-code";
import coreSettings from "./plugins/settings";
import openRecent from "./plugins/open-recent";
import codeIntelligence from "./plugins/code-intelligence";

const builtinPlugins: RunePlugin[] = [
  formatPythonPlugin,
  terminalPlugin,
  workspaceSearchPlugin,
  commandPalettePlugin,
  sampleThemeIconPlugin,
  fileIconsPlugin,
  coreRunCode,
  coreSettings,
  openRecent,
  codeIntelligence,
];

export function initPlugins(options?: RuneAPIOptions): void {
  pluginRegistry.deactivateAll();

  const allPlugins = [...builtinPlugins];

  for (const plugin of allPlugins) {
    try {
      const api = createRuneAPI(plugin, options);
      const cleanup = plugin.activate(api);
      pluginRegistry.setCleanup(plugin.id, cleanup ?? undefined);
    } catch (err) {
      console.error(`[rune] plugin failed: ${plugin.id}`, err);
    }
  }
}

export { pluginRegistry } from "./registry";
