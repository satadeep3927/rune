import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { invoke } from "@tauri-apps/api/core";
import { readTextFile, writeTextFile, mkdir } from "@tauri-apps/plugin-fs";
import type { ThemeColors } from "@/types";

function joinPath(...parts: string[]): string {
  const sep = parts[0]?.includes("\\") ? "\\" : "/";
  return parts.join(sep).replace(/[/\\]+/g, sep);
}

export interface GlobalSettings {
  theme: string;
  customTheme?: Partial<ThemeColors>;
  editorFontSize: number;
  editorFontFamily: string;
  wordWrap: boolean;
  terminalFontSize: number;
  defaultZoom: number;
  fileAssociations?: Record<string, "text" | "image" | "pdf" | "markdown">;
}

export interface WorkspaceSettings {
  runCommand: string;
  excludeItems: string[];
  runMap?: Record<string, string>;
}

const DEFAULT_GLOBAL: GlobalSettings = {
  theme: "rune-light",
  editorFontSize: 14,
  editorFontFamily: "Consolas",
  wordWrap: true,
  terminalFontSize: 12,
  defaultZoom: 1,
  fileAssociations: {},
};

const DEFAULT_WORKSPACE: WorkspaceSettings = {
  runCommand: "echo 'Hello from Rune!'",
  excludeItems: [".git", "node_modules", ".rune"],
  runMap: {},
};

export const [globalSettings, setGlobalSettings] =
  createStore<GlobalSettings>(DEFAULT_GLOBAL);
export const [workspaceSettings, setWorkspaceSettings] =
  createStore<WorkspaceSettings>(DEFAULT_WORKSPACE);

export let workspaceRootPath: string | null = null;
let cachedHomeDir: string | null = null;

interface StartupData {
  home_dir: string;
  global_settings: string | null;
  workspace_settings: string | null;
}

export async function initGlobalSettings() {
  try {
    if (!cachedHomeDir) cachedHomeDir = await getHomeDir();
    const configPath = joinPath(cachedHomeDir, ".rune", "settings.json");
    try {
      const content = await readTextFile(configPath);
      const parsed = JSON.parse(content);
      setGlobalSettings({ ...DEFAULT_GLOBAL, ...parsed });
      localStorage.setItem("rune_theme", parsed.theme || DEFAULT_GLOBAL.theme);
      if (parsed.theme === "custom" && parsed.customTheme?.bg) {
        localStorage.setItem("rune_bg", parsed.customTheme.bg);
      }
    } catch {
      await mkdir(joinPath(cachedHomeDir, ".rune"), { recursive: true }).catch(
        () => {},
      );
      await writeTextFile(configPath, JSON.stringify(DEFAULT_GLOBAL, null, 2));
    }
  } catch (e) {
    console.error("Failed to init global settings", e);
  }
}

export async function getHomeDir(): Promise<string> {
  if (cachedHomeDir) return cachedHomeDir;
  // Try batched load_startup first (also reads settings for free)
  const data: StartupData = await invoke("load_startup", {
    workspacePath: null,
  });
  cachedHomeDir = data.home_dir;
  // Also apply any settings that came back
  if (data.global_settings) {
    try {
      const parsed = JSON.parse(data.global_settings);
      setGlobalSettings({ ...DEFAULT_GLOBAL, ...parsed });
      localStorage.setItem("rune_theme", parsed.theme || DEFAULT_GLOBAL.theme);
      if (parsed.theme === "custom" && parsed.customTheme?.bg) {
        localStorage.setItem("rune_bg", parsed.customTheme.bg);
      }
    } catch {}
  }
  return cachedHomeDir!;
}

export async function loadAllSettings(
  workspacePath: string | null,
): Promise<void> {
  workspaceRootPath = workspacePath;
  try {
    const data: StartupData = await invoke("load_startup", { workspacePath });
    cachedHomeDir = data.home_dir;

    if (data.global_settings) {
      try {
        const parsed = JSON.parse(data.global_settings);
        setGlobalSettings({ ...DEFAULT_GLOBAL, ...parsed });
        localStorage.setItem(
          "rune_theme",
          parsed.theme || DEFAULT_GLOBAL.theme,
        );
        if (parsed.theme === "custom" && parsed.customTheme?.bg) {
          localStorage.setItem("rune_bg", parsed.customTheme.bg);
        }
      } catch {}
    }

    if (data.workspace_settings) {
      try {
        const parsed = JSON.parse(data.workspace_settings);
        if (!parsed.runCommand && (parsed.run || parsed.runScript)) {
          parsed.runCommand = parsed.run || parsed.runScript;
        }
        setWorkspaceSettings({ ...DEFAULT_WORKSPACE, ...parsed });
      } catch {}
    } else {
      setWorkspaceSettings({ ...DEFAULT_WORKSPACE });
    }
  } catch (e) {
    console.error("Failed to load settings", e);
  }
}

export async function saveGlobalSettings() {
  try {
    if (!cachedHomeDir) cachedHomeDir = await getHomeDir();
    const configDir = joinPath(cachedHomeDir, ".rune");
    const configPath = joinPath(configDir, "settings.json");
    await mkdir(configDir, { recursive: true }).catch(() => {});
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
    const configPath = joinPath(rootPath, ".rune", "settings.json");
    const content = await readTextFile(configPath);
    const parsed = JSON.parse(content);
    if (!parsed.runCommand && (parsed.run || parsed.runScript)) {
      parsed.runCommand = parsed.run || parsed.runScript;
    }
    setWorkspaceSettings({ ...DEFAULT_WORKSPACE, ...parsed });
  } catch {
    setWorkspaceSettings({ ...DEFAULT_WORKSPACE });
  }
}

export async function saveWorkspaceSettings() {
  if (!workspaceRootPath) return;
  try {
    const configDir = joinPath(workspaceRootPath, ".rune");
    const configPath = joinPath(configDir, "settings.json");
    await mkdir(configDir, { recursive: true }).catch(() => {});
    const data = JSON.parse(JSON.stringify(workspaceSettings));
    await writeTextFile(configPath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Failed to save workspace settings", e);
  }
}

function createSettingsStore() {
  const [sidebarVisible, setSidebarVisible] = createSignal(true);
  const [sidebarWidth, setSidebarWidth] = createSignal(250);
  const [splitActive, setSplitActive] = createSignal(false);
  const [splitWidth, setSplitWidth] = createSignal(50);
  const [zoomLevel, setZoomLevel] = createSignal(1);

  function toggleSidebar() {
    setSidebarVisible(!sidebarVisible());
  }

  function applyZoom(level: number) {
    document.documentElement.style.setProperty("--app-zoom", level.toString());
    setGlobalSettings("defaultZoom", level);
    saveGlobalSettings();
  }

  function zoomIn() {
    setZoomLevel((z) => Math.round(Math.min(z + 0.1, 2) * 10) / 10);
    applyZoom(zoomLevel());
  }

  function zoomOut() {
    setZoomLevel((z) => Math.round(Math.max(z - 0.1, 0.5) * 10) / 10);
    applyZoom(zoomLevel());
  }

  function zoomReset() {
    setZoomLevel(1);
    applyZoom(zoomLevel());
  }

  function setZoomTo(level: number) {
    const rounded = Math.round(level * 10) / 10;
    setZoomLevel(rounded);
    applyZoom(rounded);
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
    zoomLevel,
    setZoomTo,
  };
}

export const settingsStore = createSettingsStore();
