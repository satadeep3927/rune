import type { RunePlugin } from "@/plugins/types";

const RECENT_KEY = "rune:recent-folders";
const MAX_RECENT = 10;

// ── Persistent store ──────────────────────────────────────────────────────────

function getRecentFolders(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function addRecentFolder(path: string): void {
  const list = getRecentFolders().filter((p) => p !== path);
  list.unshift(path);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Return just the last path component as a human-readable label. */
function folderName(path: string): string {
  return path.replace(/\\/g, "/").split("/").filter(Boolean).pop() ?? path;
}

// ── Plugin definition ─────────────────────────────────────────────────────────

const openRecentPlugin: RunePlugin = {
  id: "rune.open-recent",
  name: "Open Recent",
  version: "1.0.0",
  type: "builtin",
  permissions: [],

  activate(api) {
    let lastRoot: string | undefined = api.workspace.rootPath();
    if (lastRoot) {
      addRecentFolder(lastRoot);
    }

    const handleWorkspaceChanged = (e: Event) => {
      const current = (e as CustomEvent<string>).detail;
      if (current && current !== lastRoot) {
        lastRoot = current;
        addRecentFolder(current);
        rebuildMenu();
      }
    };

    window.addEventListener("rune-workspace-changed", handleWorkspaceChanged);

    // Register an initial placeholder that will be replaced immediately below.
    rebuildMenu();

    function rebuildMenu() {
      const recent = getRecentFolders();

      // Clear any previously registered "open-recent" items so we don't stack.
      // The registry supports re-registration by id, but we use a sentinel
      // separator + items pattern: just wipe old registrations by re-registering
      // the same slot (registry deduplication by label prefix).
      const recentItems =
        recent.length === 0
          ? [{ label: "No recent folders", action: () => {} }]
          : [
              ...recent.map((path) => ({
                label: folderName(path),
                detail: path,
                action: async () => {
                  window.dispatchEvent(
                    new CustomEvent("rune-open-folder", { detail: path }),
                  );
                },
              })),
              { separator: true as const, label: "" },
              {
                label: "Clear Recent",
                action: () => {
                  localStorage.removeItem(RECENT_KEY);
                  rebuildMenu();
                },
              },
            ];

      api.ui.registerMenuItem({
        menu: "File",
        item: {
          label: "Open Recent",
          submenu: recentItems,
        },
      });
    }

    api.ui.registerCommand({
      id: "open-recent.show-dialog",
      label: "Open Recent Workspace",
      shortcut: "Ctrl+R",
      category: "File",
      action: async () => {
        const recent = getRecentFolders();
        if (recent.length === 0) {
          await api.ui.showMessage("No recent workspaces found.");
          return;
        }

        const items = recent.map((path) => ({
          id: path,
          label: folderName(path),
          detail: path,
        }));

        const selected = await api.ui.showQuickPick?.(items, {
          placeholder: "Select a recent workspace to open...",
        });

        if (selected) {
          window.dispatchEvent(
            new CustomEvent("rune-open-folder", { detail: selected }),
          );
        }
      },
    });

    return () => {
      window.removeEventListener(
        "rune-workspace-changed",
        handleWorkspaceChanged,
      );
    };
  },
};

export default openRecentPlugin;
