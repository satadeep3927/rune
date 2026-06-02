export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileEntry[];
  isExpanded?: boolean;
}

export type FileType = "text" | "image" | "pdf" | "markdown" | "settings";

export type PaneSide = "left" | "right";

export interface Tab {
  id: string;
  filePath: string;
  fileName: string;
  content: string;
  savedContent: string;
  language: string;
  isDirty: boolean;
  fileType: FileType;
  dataUrl?: string;
  cursorPosition?: { line: number; col: number };
  pane: PaneSide;
}

export type ThemeMode = "dark" | "light";

export interface ThemeColors {
  bg: string;
  bgSecondary: string;
  bgTertiary: string;
  fg: string;
  fgMuted: string;
  accent: string;
  accentHover: string;
  border: string;
  borderFocus: string;
  error: string;
  warning: string;
  success: string;
}

export interface MenuItem {
  label: string;
  accelerator?: string;
  action?: () => void;
  separator?: boolean;
  disabled?: boolean;
  submenu?: MenuItem[];
}

export interface MenuDefinition {
  label: string;
  items: MenuItem[];
}
