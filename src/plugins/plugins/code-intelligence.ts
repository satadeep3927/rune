import type { RunePlugin, RuneAPI } from "@/plugins/types";

export interface Symbol {
  name: string;
  kind: string;
  line: number;
  path: string;
}

const codeIntelligencePlugin: RunePlugin = {
  id: "core.code-intelligence",
  name: "Code Intelligence",
  version: "1.0.0",
  type: "builtin",
  permissions: [],
  activate(api: RuneAPI) {
    // 1. Workspace Symbol Search (Ctrl+T) — opens unified palette in # mode
    api.ui.registerCommand({
      id: "code-intelligence.workspace-symbol-search",
      label: "Go to Symbol in Workspace",
      shortcut: "Ctrl+T",
      category: "Go To",
      action: () => {
        window.dispatchEvent(
          new CustomEvent("rune-open-palette", { detail: { prefix: "#" } }),
        );
      },
    });

    // 2. Document Outline (Ctrl+Shift+O) — opens unified palette in @ mode
    api.ui.registerCommand({
      id: "code-intelligence.document-outline",
      label: "Go to Symbol in File",
      shortcut: "Ctrl+Shift+O",
      category: "Go To",
      action: () => {
        window.dispatchEvent(
          new CustomEvent("rune-open-palette", { detail: { prefix: "@" } }),
        );
      },
    });

    // F12 Go to Definition is handled directly in CodeMirrorView.tsx
  },
};

export default codeIntelligencePlugin;
