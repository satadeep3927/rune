import type { FileEntry, MenuItem, ThemeColors } from "@/types";

// ── Plugin Manifest ──

export type PluginType = "builtin" | "third-party";

export interface RunePlugin {
  id: string;
  name: string;
  version: string;
  type: PluginType;
  permissions: string[];
  allowedCommands?: string[];
  activate(api: RuneAPI): void | (() => void);
}

// ── Extension Point Registrations ──

export type MenuContext = "file-tree" | "editor" | "tab";

export interface ContextInfo {
  entry?: FileEntry;
  language?: string;
  filePath?: string;
  selectedPaths?: Set<string>;
}

export interface ContextMenuRegistration {
  id: string;
  label: string;
  context: MenuContext;
  when: (ctx: ContextInfo) => boolean;
  priority?: number;
  action: (ctx: ContextInfo) => void | Promise<void>;
  icon?: string;
  hint?: string;
  pluginId?: string; // Automatically set by API wrapper
}

export interface CommandRegistration {
  id: string;
  label: string;
  shortcut?: string;
  category: string;
  action: () => void | Promise<void>;
}

export interface MenuItemRegistration {
  menu: string; // e.g. "File", "Edit", "View", "Help", or custom
  item: MenuItem;
  priority?: number;
}

export interface TitlebarItemRegistration {
  id: string;
  icon: string; // SVG content
  title: string;
  action: () => void;
  priority?: number;
}

export interface ExplorerToolbarItemRegistration {
  id: string;
  icon: string; // SVG content or Lucide icon name or React/Solid node? We can use SVG content since Titlebar does the same. Wait, FileTree uses Lucide. I'll just use SVG string.
  title: string;
  action: () => void;
  priority?: number;
}

export interface IconProvider {
  id: string;
  getFileIcon?: (
    fileName: string,
  ) => Promise<string | undefined> | string | undefined; // Returns raw SVG string
  getFolderIcon?: (
    folderName: string,
    expanded: boolean,
  ) => Promise<string | undefined> | string | undefined; // Returns raw SVG string
}

// ── Process Execution ──

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

// ── The Rune API exposed to plugins ──

export interface RuneFS {
  read(path: string): Promise<string>;
  write(path: string, content: string): Promise<void>;
}

export interface RuneEditor {
  getActiveContent(): string | undefined;
  getActiveFilePath(): string | undefined;
  refresh(path: string): Promise<void>;
}

export interface RuneProcess {
  exec(command: string, args: string[]): Promise<ExecResult>;
}

export interface RuneUI {
  registerContextMenuItem(registration: ContextMenuRegistration): void;
  registerCommand(registration: CommandRegistration): void;
  registerMenuItem(registration: MenuItemRegistration): void;
  registerTheme(name: string, colors: ThemeColors): void;
  registerIconProvider(provider: IconProvider): void;
  registerTitlebarItem(registration: TitlebarItemRegistration): void;
  registerExplorerToolbarItem(
    registration: ExplorerToolbarItemRegistration,
  ): void;
  toggleTerminal(): void;
  toggleWorkspaceSearch(): void;
  toggleCommandPalette(): void;
  runInTerminal(command: string): void;
  openSettings(): void;
  showConfirm(
    message: string,
    options?: {
      detail?: string;
      okLabel?: string;
      cancelLabel?: string;
      variant?: "primary" | "danger";
    },
  ): Promise<boolean>;
  showMessage(
    message: string,
    options?: {
      detail?: string;
      okLabel?: string;
    },
  ): Promise<void>;
  showQuickPick(
    items: { id: string; label: string; detail?: string }[],
    options?: { placeholder?: string },
  ): Promise<string | undefined>;
}

export interface RuneWorkspace {
  rootPath(): string | undefined;
  openFile(path: string): Promise<void>;
}

export interface RuneAPI {
  fs: RuneFS;
  editor: RuneEditor;
  process: RuneProcess;
  ui: RuneUI;
  workspace: RuneWorkspace;
}
