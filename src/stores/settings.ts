import { createStore } from "solid-js/store";
import { homeDir, join } from "@tauri-apps/api/path";
import { readTextFile, writeTextFile, mkdir, exists } from "@tauri-apps/plugin-fs";
import type { ThemeColors } from "../types";

export interface GlobalSettings {
  theme: string;
  customTheme?: Partial<ThemeColors>;
  editorFontSize: number;
  editorFontFamily: string;
  wordWrap: boolean;
  terminalFontSize: number;
}

export interface WorkspaceSettings {
  runCommand: string;
  excludeItems: string[];
}

const DEFAULT_GLOBAL: GlobalSettings = {
  theme: "rune-light",
  editorFontSize: 14,
  editorFontFamily: "Consolas",
  wordWrap: true,
  terminalFontSize: 12,
};

const DEFAULT_WORKSPACE: WorkspaceSettings = {
  runCommand: "echo 'Hello from Rune!'",
  excludeItems: [".git", "node_modules", ".rune"],
};

export const [globalSettings, setGlobalSettings] = createStore<GlobalSettings>(DEFAULT_GLOBAL);
export const [workspaceSettings, setWorkspaceSettings] = createStore<WorkspaceSettings>(DEFAULT_WORKSPACE);

let workspaceRootPath: string | null = null;

export async function initGlobalSettings() {
  try {
    const home = await homeDir();
    const configDir = await join(home, ".rune");
    const configPath = await join(configDir, "settings.json");

    if (await exists(configPath)) {
      const content = await readTextFile(configPath);
      const parsed = JSON.parse(content);
      setGlobalSettings({ ...DEFAULT_GLOBAL, ...parsed });
      localStorage.setItem("rune_theme", parsed.theme || DEFAULT_GLOBAL.theme);
      if (parsed.theme === "custom" && parsed.customTheme?.bg) {
        localStorage.setItem("rune_bg", parsed.customTheme.bg);
      }
    } else {
      await mkdir(configDir, { recursive: true }).catch(() => {});
      await writeTextFile(configPath, JSON.stringify(DEFAULT_GLOBAL, null, 2));
    }
  } catch (e) {
    console.error("Failed to init global settings", e);
  }
}

export async function saveGlobalSettings() {
  try {
    const home = await homeDir();
    const configPath = await join(home, ".rune", "settings.json");
    // Deep clone to plain object
    const data = JSON.parse(JSON.stringify(globalSettings));
    await writeTextFile(configPath, JSON.stringify(data, null, 2));
    localStorage.setItem("rune_theme", globalSettings.theme);
    if (globalSettings.theme === "custom" && globalSettings.customTheme?.bg) {
      localStorage.setItem("rune_bg", globalSettings.customTheme.bg);
    }
  } catch (e) {
    console.error("Failed to save global settings", e);
  }
}

export async function loadWorkspaceSettings(rootPath: string | null) {
  workspaceRootPath = rootPath;
  if (!rootPath) return;

  try {
    const configDir = await join(rootPath, ".rune");
    const configPath = await join(configDir, "settings.json");

    if (await exists(configPath)) {
      const content = await readTextFile(configPath);
      const parsed = JSON.parse(content);
      setWorkspaceSettings({ ...DEFAULT_WORKSPACE, ...parsed });
    } else {
      setWorkspaceSettings({ ...DEFAULT_WORKSPACE });
    }
  } catch (e) {
    console.error("Failed to load workspace settings", e);
  }
}

export async function saveWorkspaceSettings() {
  if (!workspaceRootPath) return;
  try {
    const configDir = await join(workspaceRootPath, ".rune");
    const configPath = await join(configDir, "settings.json");
    await mkdir(configDir, { recursive: true }).catch(() => {});
    
    // Deep clone to plain object
    const data = JSON.parse(JSON.stringify(workspaceSettings));
    await writeTextFile(configPath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Failed to save workspace settings", e);
  }
}

import { createSignal } from "solid-js";

function createSettingsStore() {
  const [sidebarVisible, setSidebarVisible] = createSignal(true);
  const [sidebarWidth, setSidebarWidth] = createSignal(250);
  const [splitActive, setSplitActive] = createSignal(false);
  const [splitWidth, setSplitWidth] = createSignal(50);
  const [zoomLevel, setZoomLevel] = createSignal(1);

  function toggleSidebar() {
    setSidebarVisible(!sidebarVisible());
  }

  function zoomIn() {
    setZoomLevel(z => Math.min(z + 0.1, 2));
    document.documentElement.style.setProperty("--app-zoom", zoomLevel().toString());
  }

  function zoomOut() {
    setZoomLevel(z => Math.max(z - 0.1, 0.5));
    document.documentElement.style.setProperty("--app-zoom", zoomLevel().toString());
  }

  function zoomReset() {
    setZoomLevel(1);
    document.documentElement.style.setProperty("--app-zoom", "1");
  }

  return {
    sidebarVisible,
    setSidebarVisible,
    sidebarWidth,
    setSidebarWidth,
    splitActive,
    setSplitActive,
    splitWidth,
    setSplitWidth,
    toggleSidebar,
    zoomIn,
    zoomOut,
    zoomReset,
  };
}

export const settingsStore = createSettingsStore();
