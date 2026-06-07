import { onMount } from "solid-js";
import {
  loadAllSettings,
  globalSettings,
  settingsStore,
} from "@/stores/settings";
import { initPlugins } from "@/plugins";

interface AppStartupOptions {
  fs: any; // Using any for now to avoid circular dependency loops with useFileSystem return type, we can type it later
  toggleTerminal: () => void;
  toggleWorkspaceSearch: () => void;
  toggleCommandPalette: () => void;
  openSettings: () => void;
  handleFileClick: (entry: { path: string; name: string }) => Promise<void>;
  showConfirmDialog: (
    message: string,
    options?: {
      detail?: string;
      okLabel?: string;
      cancelLabel?: string;
      variant?: "primary" | "danger";
      hideCancel?: boolean;
    },
  ) => Promise<boolean>;
  showQuickPick: (
    items: { id: string; label: string; detail?: string }[],
    options?: { placeholder?: string },
  ) => Promise<string | undefined>;
}

export function useAppStartup(options: AppStartupOptions) {
  const {
    fs,
    toggleTerminal,
    toggleWorkspaceSearch,
    toggleCommandPalette,
    openSettings,
    handleFileClick,
    showConfirmDialog,
    showQuickPick,
  } = options;

  onMount(() => {
    // Show window immediately — don't wait for I/O
    (async () => {
      try {
        const { getCurrentWebviewWindow } =
          await import("@tauri-apps/api/webviewWindow");
        getCurrentWebviewWindow()
          .show()
          .catch(() => {});
      } catch (e) {}
    })();

    // Init filesystem — this is the hot path for workspace restore

    (async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const ctx: { workspace: string | null; file_to_open: string | null } =
          await invoke("get_window_context");

        if (ctx.workspace) {
          await fs.openFolderByPath(ctx.workspace);

          if (ctx.file_to_open) {
            const name = ctx.file_to_open.split(/[\\/]/).pop() ?? "";
            setTimeout(() => {
              handleFileClick({ path: ctx.file_to_open!, name });
            }, 300); // Give fs a tiny moment to init
          }
        } else {
          await fs.init();
        }
      } catch (e) {
        console.error("Failed to load window context", e);
        await fs.init();
      }
    })();

    // Load settings and init plugins in background — don't block
    initPlugins({
      getRootPath: fs.rootPath,
      toggleTerminal,
      toggleWorkspaceSearch,
      toggleCommandPalette,
      openSettings,
      openFile: async (path: string) => {
        const name = path.split(/[\\/]/).pop() ?? "";
        await handleFileClick({ path, name });
      },
      showConfirm: showConfirmDialog,
      showQuickPick,
    });

    // Batch-load all settings in a single IPC call
    loadAllSettings(fs.rootPath()).then(() => {
      // Apply persisted zoom after settings are loaded from disk
      const savedZoom = globalSettings.defaultZoom;
      if (savedZoom && savedZoom !== 1) {
        settingsStore.setZoomTo(savedZoom);
      }
    });

    (async () => {
      try {
        const { getCurrentWebviewWindow } =
          await import("@tauri-apps/api/webviewWindow");
        setTimeout(() => {
          getCurrentWebviewWindow()
            .show()
            .catch(() => {});
        }, 50);
      } catch (e) {}

      // Handle "Open with Rune" / "Open as Rune Project" CLI arg + file association
      try {
        const { stat } = await import("@tauri-apps/plugin-fs");
        const { getCurrentWebviewWindow } =
          await import("@tauri-apps/api/webviewWindow");

        await getCurrentWebviewWindow().listen<string>(
          "open-path",
          async (event) => {
            let path = event.payload;
            if (!path) return;

            // Strip any remaining file:// prefix (safety net)
            if (path.startsWith("file:///")) {
              path = decodeURIComponent(path.slice(8)).replace(/\//g, "\\");
            } else if (path.startsWith("file://")) {
              path = decodeURIComponent(path.slice(7)).replace(/\//g, "\\");
            }

            // Show and focus window
            getCurrentWebviewWindow()
              .show()
              .catch(() => {});
            getCurrentWebviewWindow()
              .setFocus()
              .catch(() => {});

            try {
              const info = await stat(path);
              if (info.isDirectory) {
                await fs.openFolderByPath(path);
              } else {
                const sep = path.includes("\\") ? "\\" : "/";
                const lastSep = path.lastIndexOf(sep);
                const name = path.substring(lastSep + 1);

                await handleFileClick({ path, name });
              }
            } catch (err) {
              console.error("open-path: failed to open", path, err);
            }
          },
        );
      } catch (e) {
        console.error("open-path: listener setup failed", e);
      }
    })();
  });
}
