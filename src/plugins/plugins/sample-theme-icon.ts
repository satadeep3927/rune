import type { RunePlugin, RuneAPI } from "@/plugins/types";

const sampleThemeIconPlugin: RunePlugin = {
  id: "sample-theme-icon",
  name: "Sample Theme & Icons",
  version: "1.0.0",
  type: "builtin",
  permissions: [],

  activate(api: RuneAPI) {
    // Register custom theme
    api.ui.registerTheme("emerald-forest", {
      bg: "#040d06",
      bgSecondary: "#08170c",
      bgTertiary: "#0d2614",
      fg: "#e2f0e6",
      fgMuted: "#7ca385",
      accent: "#10b981",
      accentHover: "#059669",
      border: "#11381c",
      borderFocus: "#10b981",
      error: "#ef4444",
      warning: "#f59e0b",
      success: "#10b981",
    });

    // Register custom icon provider for .log files
    api.ui.registerIconProvider({
      id: "log-icon-provider",
      getFileIcon(fileName: string) {
        if (fileName.endsWith(".log")) {
          return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="16" height="16" rx="2" fill="#10B981" fill-opacity="0.2"/>
            <path d="M4 4H12V5H4V4ZM4 7H12V8H4V7ZM4 10H9V11H4V10Z" fill="#10B981"/>
          </svg>`;
        }
        return undefined;
      },
    });
  },
};

export default sampleThemeIconPlugin;
