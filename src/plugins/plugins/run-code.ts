import type { RunePlugin, RuneAPI } from "@/plugins/types";

// A robust Run Code plugin
const runCodePlugin: RunePlugin = {
  id: "core.run-code",
  name: "Run Code",
  version: "1.0.0",
  type: "builtin",
  permissions: ["process.exec"],
  activate(api: RuneAPI) {
    const getRunCommand = async (filePath: string): Promise<string> => {
      const root = api.workspace.rootPath();
      let command = "";

      const lowerPath = filePath.toLowerCase();
      const extMatch = lowerPath.match(/\.[^.]+$/);
      const ext = extMatch ? extMatch[0] : "";

      if (root) {
        const settingsPath = `${root.replace(/\\/g, "/")}/.rune/settings.json`;
        try {
          const content = await api.fs.read(settingsPath);
          const config = JSON.parse(content);

          if (config.runMap && config.runMap[ext]) {
            command = config.runMap[ext];
          } else if (config.runCommand) {
            command = config.runCommand;
          } else if (config.run || config.runScript) {
            command = config.run || config.runScript;
          }
        } catch (e) {
          // ignore if settings.json doesn't exist or is invalid
        }
      }

      // Fallback defaults
      if (!command) {
        if (ext === ".py") command = 'python "{file}"';
        else if (ext === ".js") command = 'node "{file}"';
        else if (ext === ".ts") command = 'npx ts-node "{file}"';
        else if (ext === ".rs") command = "cargo run";
        else if (ext === ".go") command = 'go run "{file}"';
      }

      if (command) {
        return command.replace(/{file}/g, filePath);
      }
      return "";
    };

    const handleMissingCommand = async (ext: string) => {
      const root = api.workspace.rootPath();
      if (!root) {
        await api.ui.showMessage(
          "Please open a workspace folder first to run code or configure run commands.",
          {
            okLabel: "OK",
          },
        );
        return;
      }

      const confirm = await api.ui.showConfirm(
        `No run command is configured for this file type (${ext || "no extension"}).\n\nWould you like to open or create .rune/settings.json to configure it?`,
        {
          okLabel: "Open/Create Settings",
          cancelLabel: "Cancel",
          variant: "primary",
        },
      );

      if (confirm) {
        const normRoot = root.replace(/\\/g, "/");
        const runeDir = `${normRoot}/.rune`;
        const settingsPath = `${runeDir}/settings.json`;

        const { exists, mkdir } = await import("@tauri-apps/plugin-fs");
        try {
          const dirExists = await exists(runeDir);
          if (!dirExists) {
            await mkdir(runeDir, { recursive: true });
          }

          const fileExists = await exists(settingsPath);
          if (!fileExists) {
            const initialConfig = {
              runMap: {
                ".py": 'python "{file}"',
                ".js": 'node "{file}"',
                ".ts": 'npx ts-node "{file}"',
                ".rs": "cargo run",
                ".go": 'go run "{file}"',
              } as Record<string, string>,
            };
            if (ext) {
              initialConfig.runMap[ext] = 'echo "Enter your command here"';
            }
            await api.fs.write(
              settingsPath,
              JSON.stringify(initialConfig, null, 2),
            );
          } else {
            try {
              const currentContent = await api.fs.read(settingsPath);
              const parsed = JSON.parse(currentContent);
              if (!parsed.runMap) {
                parsed.runMap = {};
              }
              if (ext && !parsed.runMap[ext]) {
                parsed.runMap[ext] = 'echo "Enter your command here"';
                await api.fs.write(
                  settingsPath,
                  JSON.stringify(parsed, null, 2),
                );
              }
            } catch (e) {
              // ignore JSON parse/write failures
            }
          }

          await api.workspace.openFile(settingsPath);
        } catch (e: any) {
          await api.ui.showMessage(
            `Failed to configure settings: ${e.message || e}`,
          );
        }
      }
    };

    const runCurrentFile = async () => {
      let filePath = api.editor.getActiveFilePath() || "";
      if (!filePath) {
        await api.ui.showMessage(
          "No file is currently active. Please open a file first.",
        );
        return;
      }

      const command = await getRunCommand(filePath);
      if (!command) {
        const lowerPath = filePath.toLowerCase();
        const extMatch = lowerPath.match(/\.[^.]+$/);
        const ext = extMatch ? extMatch[0] : "";
        await handleMissingCommand(ext);
        return;
      }

      api.ui.toggleTerminal();
      api.ui.runInTerminal(command);
    };

    // Register a titlebar action button
    api.ui.registerTitlebarItem({
      id: "run-code-button",
      title: "Run Code",
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
      action: runCurrentFile,
      priority: 10,
    });

    // Register an explorer toolbar action button
    api.ui.registerExplorerToolbarItem({
      id: "run-code-explorer-button",
      title: "Run Code",
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
      action: runCurrentFile,
      priority: 10,
    });

    // Register command palette command
    api.ui.registerCommand({
      id: "run-code.run-file",
      label: "Run Active File",
      shortcut: "Ctrl+F5",
      category: "Run",
      action: runCurrentFile,
    });

    // Register menu item
    api.ui.registerMenuItem({
      menu: "Run",
      item: {
        label: "Run Active File",
        accelerator: "Ctrl+F5",
        action: runCurrentFile,
      },
      priority: 10,
    });

    // Register context menu item
    api.ui.registerContextMenuItem({
      id: "run-code-context",
      label: "Run File",
      context: "file-tree",
      when: () => true, // Show for all files, we'll try to resolve a command
      action: async (ctx) => {
        if (ctx.entry && !ctx.entry.isDirectory) {
          const command = await getRunCommand(ctx.entry.path);
          if (command) {
            api.ui.toggleTerminal();
            api.ui.runInTerminal(command);
          } else {
            const lowerPath = ctx.entry.path.toLowerCase();
            const extMatch = lowerPath.match(/\.[^.]+$/);
            const ext = extMatch ? extMatch[0] : "";
            await handleMissingCommand(ext);
          }
        }
      },
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
      priority: 5,
    });
  },
};

export default runCodePlugin;
