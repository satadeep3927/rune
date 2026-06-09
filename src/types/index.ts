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
  diskHash?: number;
  hasConflict?: boolean;
  externalContent?: string;
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

export interface SearchResult {
  filePath: string;
  fileName: string;
  line: number;
  col: number;
  text: string;
  matchStart: number;
  matchEnd: number;
}

export interface QuickPickItem {
  id: string;
  label: string;
  detail?: string;
}

export interface CommandItem {
  id: string;
  label: string;
  shortcut?: string;
  action: () => void;
  category?: string;
}

export interface WorkspaceSymbol {
  name: string;
  kind: string;
  line: number;
  path: string;
}

export type PaletteMode =
  | "command"
  | "file"
  | "workspace-symbol"
  | "document-symbol";

export type MdMode = "edit" | "preview" | "split";
