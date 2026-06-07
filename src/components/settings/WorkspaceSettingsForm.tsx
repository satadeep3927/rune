import { For } from "solid-js";
import { SettingRow } from "./SettingRow";
import { Input } from "@/components/ui/Input";
import { useWorkspaceSettings } from "@/hooks/useWorkspaceSettings";

export function WorkspaceSettingsForm() {
  const {
    workspaceSettings,
    newExt,
    setNewExt,
    newCmd,
    setNewCmd,
    handleExcludeItems,
    handleRunCommand,
    updateRunMapVal,
    removeRunMapVal,
    addRunMapVal,
  } = useWorkspaceSettings();

  return (
    <div class="flex flex-col pb-12">
      <section class="mb-8">
        <h2 class="text-xl font-semibold mb-2 text-[var(--color-accent)]">
          File Explorer
        </h2>

        <SettingRow
          label="Exclude Items"
          description="Comma-separated list of files and folders to hide from the file tree."
        >
          <Input
            type="text"
            value={workspaceSettings.excludeItems.join(", ")}
            onChange={handleExcludeItems}
            placeholder=".git, node_modules"
          />
        </SettingRow>
      </section>

      <section class="mb-8">
        <h2 class="text-xl font-semibold mb-2 text-[var(--color-accent)]">
          Build & Run
        </h2>

        <SettingRow
          label="Run Command"
          description="The command executed when clicking the Play button."
        >
          <Input
            type="text"
            value={workspaceSettings.runCommand}
            onChange={handleRunCommand}
            placeholder="npm run dev"
            class="font-mono"
          />
        </SettingRow>
      </section>

      <section class="mb-8">
        <h2 class="text-xl font-semibold mb-4 text-[var(--color-accent)]">
          File Run Mappings
        </h2>
        <div class="flex flex-col gap-3 p-4 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
          <div class="grid grid-cols-12 gap-2 font-medium text-xs text-[var(--color-fg-muted)] pb-2 border-b border-[var(--color-border)]">
            <div class="col-span-3">Extension</div>
            <div class="col-span-8">Run Command</div>
            <div class="col-span-1 text-right font-semibold">Action</div>
          </div>

          <For each={Object.entries(workspaceSettings.runMap || {})}>
            {([ext, cmd]) => (
              <div class="grid grid-cols-12 gap-2 items-center text-sm py-1">
                <div class="col-span-3 font-mono">{ext}</div>
                <Input
                  type="text"
                  value={cmd}
                  onChange={(e) => updateRunMapVal(ext, e.currentTarget.value)}
                  class="col-span-8 font-mono text-xs"
                />
                <button
                  onClick={() => removeRunMapVal(ext)}
                  class="col-span-1 text-xs text-[var(--color-error)] hover:opacity-80 cursor-pointer text-center bg-transparent border-0 font-semibold"
                >
                  Remove
                </button>
              </div>
            )}
          </For>

          {/* Add Row */}
          <div class="grid grid-cols-12 gap-2 items-center pt-3 border-t border-[var(--color-border)]">
            <Input
              type="text"
              placeholder=".py"
              value={newExt()}
              onInput={(e) => setNewExt(e.currentTarget.value)}
              class="col-span-3 font-mono text-xs"
            />
            <Input
              type="text"
              placeholder='python "{file}"'
              value={newCmd()}
              onInput={(e) => setNewCmd(e.currentTarget.value)}
              class="col-span-7 font-mono text-xs"
            />
            <button
              onClick={addRunMapVal}
              class="col-span-2 px-2 py-1 rounded text-xs transition-colors cursor-pointer font-semibold"
              style={{
                background: "var(--color-accent-dim, rgba(205, 255, 7, 0.15))",
                color: "var(--color-accent, #CDFF07)",
                border: "1px solid var(--color-accent, #CDFF07)",
              }}
            >
              Add
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
