import { createContext, useContext, createEffect, type JSX } from "solid-js";
import type { ThemeColors, ThemeMode } from "@/types";
import { themes, getThemeColors } from "./themes";
import {
  globalSettings,
  setGlobalSettings,
  saveGlobalSettings,
} from "@/stores/settings";

interface ThemeContextValue {
  theme: () => ThemeColors;
  themeName: () => string;
  setTheme: (name: string) => void;
  mode: () => ThemeMode;
}

const ThemeContext = createContext<ThemeContextValue>();

export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx)
    throw new Error("useThemeContext must be used within ThemeProvider");
  return ctx;
}

function applyThemeToDOM(t: ThemeColors, isLight: boolean) {
  const root = document.documentElement;
  root.style.setProperty("--color-bg", t.bg);
  root.style.setProperty("--color-bg-secondary", t.bgSecondary);
  root.style.setProperty("--color-bg-tertiary", t.bgTertiary);
  root.style.setProperty("--color-fg", t.fg);
  root.style.setProperty("--color-fg-muted", t.fgMuted);
  root.style.setProperty("--color-accent", t.accent);
  root.style.setProperty("--color-accent-hover", t.accentHover);
  root.style.setProperty("--color-border", t.border);
  root.style.setProperty("--color-border-focus", t.borderFocus);
  root.style.setProperty("--color-error", t.error);
  root.style.setProperty("--color-warning", t.warning);
  root.style.setProperty("--color-success", t.success);

  // Derived properties
  root.style.setProperty("--color-sidebar-bg", t.bgSecondary);
  root.style.setProperty("--color-tab-bg", t.bgTertiary);
  root.style.setProperty("--color-tab-active-bg", t.bg);
  root.style.setProperty("--color-titlebar-bg", t.bg);
  root.style.setProperty("--color-menu-bg", t.bgSecondary);
  root.style.setProperty("--color-menu-hover", t.bgTertiary);
  root.style.setProperty("--color-scrollbar-track", t.bg);
  root.style.setProperty("--color-scrollbar-thumb", t.bgTertiary);

  if (isLight) {
    root.setAttribute("data-theme", "light");
  } else {
    root.setAttribute("data-theme", "dark");
  }
}

interface ThemeProviderProps {
  children: JSX.Element;
  defaultTheme?: string;
}

export function ThemeProvider(props: ThemeProviderProps) {
  const theme = () => {
    if (globalSettings.theme === "custom" && globalSettings.customTheme) {
      const base = themes["rune-blue"]!;
      return { ...base, ...globalSettings.customTheme } as ThemeColors;
    }
    return getThemeColors(globalSettings.theme) ?? themes["rune-blue"]!;
  };

  const isLightThemeActive = () => {
    if (
      globalSettings.theme === "rune-light" ||
      globalSettings.theme === "pure-white" ||
      globalSettings.theme === "solarized-light"
    )
      return true;
    if (globalSettings.theme === "custom") {
      const t = theme();
      const bg = t.bg || "#0B0F00";
      try {
        const c = bg.startsWith("#") ? bg.substring(1) : bg;
        const rgb = parseInt(c, 16);
        const r = (rgb >> 16) & 0xff;
        const g = (rgb >> 8) & 0xff;
        const b = (rgb >> 0) & 0xff;
        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        return luma > 128;
      } catch (e) {
        return false;
      }
    }
    return false;
  };

  const mode = (): ThemeMode => (isLightThemeActive() ? "light" : "dark");

  function handleSetTheme(name: string) {
    setGlobalSettings({ theme: name });
    saveGlobalSettings();
  }

  createEffect(() => {
    applyThemeToDOM(theme(), isLightThemeActive());
  });

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeName: () => globalSettings.theme,
        setTheme: handleSetTheme,
        mode,
      }}
    >
      {props.children}
    </ThemeContext.Provider>
  );
}
