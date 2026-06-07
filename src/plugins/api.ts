import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";
import { tabStore } from "@/stores/tabs";
import { pluginRegistry } from "./registry";
import type { RunePlugin, RuneAPI, ExecResult } from "./types";

export interface RuneAPIOptions {
  getRootPath?: () => string | null;
  toggleTerminal?: () => void;
  toggleWorkspaceSearch?: () => void;
  toggleCommandPalette?: () => void;
  openSettings?: () => void;
  openFile?: (path: string) => Promise<void>;
  showConfirm?: (
    message: string,
    options?: {
      detail?: string;
      okLabel?: string;
      cancelLabel?: string;
      variant?: "primary" | "danger";
      hideCancel?: boolean;
    },
  ) => Promise<boolean>;
  showQuickPick?: (
    items: { id: string; label: string; detail?: string }[],
    options?: { placeholder?: string },
  ) => Promise<string | undefined>;
}

function checkPermission(plugin: RunePlugin, permission: string): void {
  if (plugin.type === "builtin") return;
  if (!plugin.permissions.includes(permission)) {
    throw new Error(`Plugin "${plugin.id}" lacks permission: ${permission}`);
  }
}

export function createRuneAPI(
  plugin: RunePlugin,
  options?: RuneAPIOptions,
): RuneAPI {
  return {
    fs: {
      async read(path: string): Promise<string> {
        checkPermission(plugin, "fs.read");
        return readTextFile(path);
      },
      async write(path: string, content: string): Promise<void> {
        checkPermission(plugin, "fs.write");
        await writeTextFile(path, content);
        const normalized = path.replace(/\\/g, "/");
        if (normalized.endsWith(".rune/settings.json")) {
          const root = options?.getRootPath?.();
          if (root) {
            const { loadWorkspaceSettings } = await import("@/stores/settings");
            await loadWorkspaceSettings(root);
          }
        }
      },
    },

    editor: {
      getActiveContent(): string | undefined {
        return tabStore.getFocusedTab()?.content;
      },
      getActiveFilePath(): string | undefined {
        return tabStore.getFocusedTab()?.filePath;
      },
      async refresh(path: string): Promise<void> {
        const newContent = await readTextFile(path);
        const normalized = newContent.replace(/\r\n/g, "\n");
        const tab = tabStore.tabs().find((t) => t.filePath === path);
        if (tab) {
          tabStore.updateTabContent(tab.id, normalized);
          tabStore.markTabClean(tab.id);
        }
      },
    },

    process: {
      async exec(command: string, args: string[]): Promise<ExecResult> {
        checkPermission(plugin, "process.exec");
        if (
          plugin.type === "third-party" &&
          plugin.allowedCommands &&
          !plugin.allowedCommands.includes(command)
        ) {
          throw new Error(
            `Plugin "${plugin.id}" is not allowed to execute: ${command}`,
          );
        }
        return invoke<ExecResult>("execute_command", { command, args });
      },
    },

    ui: {
      registerContextMenuItem(registration): void {
        pluginRegistry.registerContextMenuItem({
          ...registration,
          pluginId: plugin.id,
        });
      },
      registerCommand(registration): void {
        pluginRegistry.registerCommand(registration);
      },
      registerMenuItem(registration): void {
        pluginRegistry.registerMenuItem(registration);
      },
      registerTheme(name, colors): void {
        pluginRegistry.registerTheme(name, colors);
      },
      registerIconProvider(provider): void {
        pluginRegistry.registerIconProvider(provider);
      },
      registerTitlebarItem(registration): void {
        pluginRegistry.registerTitlebarItem(registration);
      },
      registerExplorerToolbarItem(registration): void {
        pluginRegistry.registerExplorerToolbarItem(registration);
      },
      toggleTerminal(): void {
        options?.toggleTerminal?.();
      },
      toggleWorkspaceSearch(): void {
        options?.toggleWorkspaceSearch?.();
      },
      toggleCommandPalette(): void {
        options?.toggleCommandPalette?.();
      },
      runInTerminal(command: string): void {
        window.dispatchEvent(
          new CustomEvent("rune-run-script", { detail: command }),
        );
      },
      openSettings(): void {
        options?.openSettings?.();
      },
      showConfirm(message, optionsList) {
        return (
          options?.showConfirm?.(message, optionsList) ?? Promise.resolve(false)
        );
      },
      async showMessage(message, optionsList) {
        await options?.showConfirm?.(message, {
          detail: optionsList?.detail,
          okLabel: optionsList?.okLabel,
          hideCancel: true,
        });
      },
      showQuickPick(items, pickOptions) {
        return (
          options?.showQuickPick?.(items, pickOptions) ??
          Promise.resolve(undefined)
        );
      },
    },

    workspace: {
      rootPath(): string | undefined {
        return options?.getRootPath?.() ?? undefined;
      },
      async openFile(path: string): Promise<void> {
        await options?.openFile?.(path);
      },
    },
  };
}
