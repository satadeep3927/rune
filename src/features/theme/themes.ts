import type { ThemeColors } from "../../types";

export const obsidianLime: ThemeColors = {
  bg: "#0B0F00",
  bgSecondary: "#111a00",
  bgTertiary: "#1a2400",
  fg: "#d4d4d4",
  fgMuted: "#6b7280",
  accent: "#CDFF07",
  accentHover: "#a8d406",
  border: "#1e2a00",
  borderFocus: "#00ff41",
  error: "#ff4444",
  warning: "#ffaa00",
  success: "#00ff41",
};

export const runeLight: ThemeColors = {
  bg: "#ffffff",
  bgSecondary: "#f6f8fa",
  bgTertiary: "#eaeef2",
  fg: "#24292f",
  fgMuted: "#57606a",
  accent: "#0969da",
  accentHover: "#0349b4",
  border: "#d0d7de",
  borderFocus: "#0969da",
  error: "#cf222e",
  warning: "#9a6700",
  success: "#1a7f37",
};

export const runeBlue: ThemeColors = {
  bg: "#0d1117",
  bgSecondary: "#161b22",
  bgTertiary: "#21262d",
  fg: "#c9d1d9",
  fgMuted: "#8b949e",
  accent: "#4A90E2",
  accentHover: "#5c9be6",
  border: "#30363d",
  borderFocus: "#58a6ff",
  error: "#f85149",
  warning: "#d29922",
  success: "#238636",
};

export const pureDark: ThemeColors = {
  bg: "#000000",
  bgSecondary: "#0a0a0a",
  bgTertiary: "#141414",
  fg: "#f5f5f5",
  fgMuted: "#888888",
  accent: "#ffffff",
  accentHover: "#cccccc",
  border: "#222222",
  borderFocus: "#ffffff",
  error: "#ff4444",
  warning: "#ffaa00",
  success: "#00ff41",
};

export const pureWhite: ThemeColors = {
  bg: "#ffffff",
  bgSecondary: "#f7f7f7",
  bgTertiary: "#efefef",
  fg: "#000000",
  fgMuted: "#777777",
  accent: "#000000",
  accentHover: "#333333",
  border: "#e0e0e0",
  borderFocus: "#000000",
  error: "#cf222e",
  warning: "#9a6700",
  success: "#1a7f37",
};

export const oneDark: ThemeColors = {
  bg: "#282c34",
  bgSecondary: "#21252b",
  bgTertiary: "#1e2227",
  fg: "#abb2bf",
  fgMuted: "#5c6370",
  accent: "#61afef",
  accentHover: "#529bd6",
  border: "#181a1f",
  borderFocus: "#61afef",
  error: "#e06c75",
  warning: "#d19a66",
  success: "#98c379",
};

export const cyan: ThemeColors = {
  bg: "#000000",
  bgSecondary: "#0a0a0a",
  bgTertiary: "#141414",
  fg: "#e6e6e6",
  fgMuted: "#777777",
  accent: "#19a6a7",
  accentHover: "#148485",
  border: "#1a1a1a",
  borderFocus: "#19a6a7",
  error: "#ff4444",
  warning: "#ffaa00",
  success: "#00ff41",
};

export const dracula: ThemeColors = {
  bg: "#282a36",
  bgSecondary: "#21222c",
  bgTertiary: "#191a21",
  fg: "#f8f8f2",
  fgMuted: "#6272a4",
  accent: "#bd93f9",
  accentHover: "#ff79c6",
  border: "#44475a",
  borderFocus: "#8be9fd",
  error: "#ff5555",
  warning: "#ffb86c",
  success: "#50fa7b",
};

export const nord: ThemeColors = {
  bg: "#2e3440",
  bgSecondary: "#242933",
  bgTertiary: "#1f232a",
  fg: "#d8dee9",
  fgMuted: "#4c566a",
  accent: "#88c0d0",
  accentHover: "#81a1c1",
  border: "#3b4252",
  borderFocus: "#8fbcbb",
  error: "#bf616a",
  warning: "#ebcb8b",
  success: "#a3be8c",
};

export const solarizedLight: ThemeColors = {
  bg: "#fdf6e3",
  bgSecondary: "#eee8d5",
  bgTertiary: "#e4dbbe",
  fg: "#586e75",
  fgMuted: "#93a1a1",
  accent: "#b58900",
  accentHover: "#cb4b16",
  border: "#d3c7a1",
  borderFocus: "#268bd2",
  error: "#dc322f",
  warning: "#cb4b16",
  success: "#859900",
};

export const cyberpunk: ThemeColors = {
  bg: "#0f051d",
  bgSecondary: "#0a0314",
  bgTertiary: "#16092b",
  fg: "#ffffff",
  fgMuted: "#8f81a1",
  accent: "#ff007f",
  accentHover: "#00f0ff",
  border: "#2b144d",
  borderFocus: "#00f0ff",
  error: "#ff003c",
  warning: "#fede00",
  success: "#00ff66",
};

export const themes: Record<string, ThemeColors> = {
  "rune-light": runeLight,
  "obsidian-lime": obsidianLime,
  "rune-blue": runeBlue,
  "pure-dark": pureDark,
  "pure-white": pureWhite,
  "one-dark": oneDark,
  "cyan": cyan,
  "dracula": dracula,
  "nord": nord,
  "solarized-light": solarizedLight,
  "cyberpunk": cyberpunk,
};
