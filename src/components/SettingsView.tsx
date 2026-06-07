import { Show } from "solid-js";
import { GlobalSettingsForm } from "./settings/GlobalSettingsForm";
import { WorkspaceSettingsForm } from "./settings/WorkspaceSettingsForm";
import { useSettingsView } from "@/hooks/useSettingsView";

export function SettingsView() {
  const { activeTab, setActiveTab } = useSettingsView();

  return (
    <div
      class="h-full w-full overflow-y-auto p-8"
      style={{ color: "var(--color-fg)", background: "var(--color-bg)" }}
    >
      <div class="max-w-3xl mx-auto">
        <h1 class="text-3xl font-bold mb-8">Settings</h1>

        <div
          class="flex gap-4 border-b mb-8"
          style={{ "border-color": "var(--color-border)" }}
        >
          <button
            class={`px-4 py-2 font-medium transition-colors ${activeTab() === "global" ? "text-[var(--color-accent)]" : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"}`}
            style={
              activeTab() === "global"
                ? { "border-bottom": "2px solid var(--color-accent)" }
                : {}
            }
            onClick={() => setActiveTab("global")}
          >
            Global Settings
          </button>
          <button
            class={`px-4 py-2 font-medium transition-colors ${activeTab() === "workspace" ? "text-[var(--color-accent)]" : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"}`}
            style={
              activeTab() === "workspace"
                ? { "border-bottom": "2px solid var(--color-accent)" }
                : {}
            }
            onClick={() => setActiveTab("workspace")}
          >
            Workspace Settings
          </button>
        </div>

        <Show when={activeTab() === "global"}>
          <GlobalSettingsForm />
        </Show>

        <Show when={activeTab() === "workspace"}>
          <WorkspaceSettingsForm />
        </Show>
      </div>
    </div>
  );
}
