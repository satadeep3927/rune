import { createSignal, For, Show, onCleanup } from "solid-js";
import { 
  globalSettings, setGlobalSettings, saveGlobalSettings, 
  workspaceSettings, setWorkspaceSettings, saveWorkspaceSettings 
} from "../stores/settings";
import { themes } from "../features/theme/themes";

export function SettingsView() {
  const [activeTab, setActiveTab] = createSignal<"global" | "workspace">("global");

  return (
    <div class="h-full w-full overflow-y-auto p-8" style={{ color: "var(--color-fg)", background: "var(--color-bg)" }}>
      <div class="max-w-3xl mx-auto">
        <h1 class="text-3xl font-bold mb-8">Settings</h1>
        
        <div class="flex gap-4 border-b mb-8" style={{ "border-color": "var(--color-border)" }}>
          <button 
            class={`px-4 py-2 font-medium transition-colors ${activeTab() === "global" ? "text-[var(--color-accent)]" : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"}`}
            style={activeTab() === "global" ? { "border-bottom": "2px solid var(--color-accent)" } : {}}
            onClick={() => setActiveTab("global")}
          >
            Global Settings
          </button>
          <button 
            class={`px-4 py-2 font-medium transition-colors ${activeTab() === "workspace" ? "text-[var(--color-accent)]" : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"}`}
            style={activeTab() === "workspace" ? { "border-bottom": "2px solid var(--color-accent)" } : {}}
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

import type { JSX } from "solid-js";

function SettingRow(props: { label: string; description?: string; children: JSX.Element }) {
  return (
    <div class="flex items-center justify-between py-4 border-b border-[var(--color-border)]">
      <div class="flex flex-col pr-8">
        <span class="font-medium text-sm">{props.label}</span>
        <Show when={props.description}>
          <span class="text-xs text-[var(--color-fg-muted)] mt-1">{props.description}</span>
        </Show>
      </div>
      <div class="w-64 shrink-0 flex items-center justify-end">
        {props.children}
      </div>
    </div>
  );
}

function CustomSelect(props: { 
  value: string; 
  options: { label: string; value: string }[]; 
  onChange: (v: string) => void;
  width?: string;
}) {
  const [isOpen, setIsOpen] = createSignal(false);
  let containerRef!: HTMLDivElement;

  const handleClickOutside = (e: MouseEvent) => {
    if (isOpen() && containerRef && !containerRef.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };

  window.addEventListener("click", handleClickOutside);
  onCleanup(() => window.removeEventListener("click", handleClickOutside));

  const selectedLabel = () => props.options.find(o => o.value === props.value)?.label || props.value;

  return (
    <div ref={containerRef} class="relative" style={{ width: props.width || "200px" }}>
      <div 
        class="flex items-center justify-between px-3 py-1.5 rounded-md border cursor-pointer select-none text-sm transition-colors"
        style={{
          background: "var(--color-bg-secondary)",
          color: "var(--color-fg)",
          "border-color": isOpen() ? "var(--color-accent)" : "var(--color-border)"
        }}
        onClick={() => setIsOpen(!isOpen())}
      >
        <span class="truncate">{selectedLabel()}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class={`transition-transform ${isOpen() ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      <Show when={isOpen()}>
        <div 
          class="absolute z-50 mt-1 w-full rounded-md border shadow-lg overflow-hidden flex flex-col max-h-60 overflow-y-auto"
          style={{
            background: "var(--color-bg-secondary)",
            "border-color": "var(--color-border)"
          }}
        >
          <For each={props.options}>
            {(opt) => (
              <div
                class="px-3 py-1.5 text-sm cursor-pointer select-none"
                style={{
                  color: props.value === opt.value ? "var(--color-accent)" : "var(--color-fg)",
                  "background-color": props.value === opt.value ? "var(--color-bg-tertiary)" : "transparent"
                }}
                onMouseEnter={(e) => {
                  if (props.value !== opt.value) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-accent)";
                    (e.currentTarget as HTMLElement).style.color = "#ffffff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (props.value !== opt.value) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                    (e.currentTarget as HTMLElement).style.color = "var(--color-fg)";
                  }
                }}
                onClick={() => {
                  props.onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                {opt.label}
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}

function GlobalSettingsForm() {
  const themeOptions = Object.keys(themes).concat(["custom"]).map(t => ({ label: t, value: t }));

  const updateCustomColor = (key: string, val: string) => {
    setGlobalSettings("customTheme", (prev) => ({ ...prev, [key]: val }));
    saveGlobalSettings();
  };

  const handleToggle = (key: "wordWrap", checked: boolean) => {
    setGlobalSettings(key, checked);
    saveGlobalSettings();
  };

  const handleNumber = (key: "editorFontSize" | "terminalFontSize", val: number) => {
    setGlobalSettings(key, val);
    saveGlobalSettings();
  };

  const handleText = (key: "editorFontFamily", val: string) => {
    setGlobalSettings(key, val);
    saveGlobalSettings();
  };

  return (
    <div class="flex flex-col pb-12">
      <section class="mb-8">
        <h2 class="text-xl font-semibold mb-2 text-[var(--color-accent)]">Appearance</h2>
        
        <SettingRow label="Color Theme" description="Select the overall theme for the editor.">
          <CustomSelect 
            value={globalSettings.theme}
            onChange={(v) => { setGlobalSettings("theme", v); saveGlobalSettings(); }}
            options={themeOptions}
          />
        </SettingRow>

        <Show when={globalSettings.theme === "custom"}>
          <div class="grid grid-cols-2 gap-4 mt-4 p-4 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
            <ColorPicker label="Background" value={globalSettings.customTheme?.bg || "#0B0F00"} onChange={(v) => updateCustomColor("bg", v)} />
            <ColorPicker label="Secondary Bg" value={globalSettings.customTheme?.bgSecondary || "#111a00"} onChange={(v) => updateCustomColor("bgSecondary", v)} />
            <ColorPicker label="Foreground" value={globalSettings.customTheme?.fg || "#d4d4d4"} onChange={(v) => updateCustomColor("fg", v)} />
            <ColorPicker label="Accent" value={globalSettings.customTheme?.accent || "#CDFF07"} onChange={(v) => updateCustomColor("accent", v)} />
            <ColorPicker label="Border" value={globalSettings.customTheme?.border || "#1e2a00"} onChange={(v) => updateCustomColor("border", v)} />
            <ColorPicker label="Error" value={globalSettings.customTheme?.error || "#ff4444"} onChange={(v) => updateCustomColor("error", v)} />
          </div>
        </Show>
      </section>

      <section class="mb-8">
        <h2 class="text-xl font-semibold mb-2 text-[var(--color-accent)]">Editor</h2>
        
        <SettingRow label="Word Wrap" description="Controls whether lines should wrap.">
          <input 
            type="checkbox" 
            checked={globalSettings.wordWrap} 
            onChange={(e) => handleToggle("wordWrap", e.target.checked)}
            class="w-4 h-4 cursor-pointer"
          />
        </SettingRow>

        <SettingRow label="Font Size" description="Controls the font size in pixels.">
          <input 
            type="number" 
            value={globalSettings.editorFontSize}
            onChange={(e) => handleNumber("editorFontSize", Number(e.target.value))}
            class="w-full max-w-[120px] px-3 py-1.5 rounded-md outline-none border text-sm"
            style={{
              background: "var(--color-bg-secondary)",
              color: "var(--color-fg)",
              "border-color": "var(--color-border)"
            }}
          />
        </SettingRow>

        <SettingRow label="Font Family" description="Controls the font family.">
          <CustomSelect 
            value={globalSettings.editorFontFamily}
            onChange={(v) => handleText("editorFontFamily", v)}
            options={[
              { label: "Consolas", value: "Consolas" },
              { label: "FiraCode Nerd Font", value: "'FiraCode Nerd Font'" },
              { label: "JetBrains Mono", value: "'JetBrains Mono'" },
              { label: "Cascadia Code", value: "'Cascadia Code'" },
              { label: "Monospace", value: "monospace" },
            ]}
          />
        </SettingRow>
      </section>

      <section class="mb-8">
        <h2 class="text-xl font-semibold mb-2 text-[var(--color-accent)]">Terminal</h2>
        
        <SettingRow label="Terminal Font Size" description="Controls the font size of the terminal in pixels.">
          <input 
            type="number" 
            value={globalSettings.terminalFontSize}
            onChange={(e) => handleNumber("terminalFontSize", Number(e.target.value))}
            class="w-full max-w-[120px] px-3 py-1.5 rounded-md outline-none border text-sm"
            style={{
              background: "var(--color-bg-secondary)",
              color: "var(--color-fg)",
              "border-color": "var(--color-border)"
            }}
          />
        </SettingRow>
      </section>
    </div>
  );
}

function ColorPicker(props: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div class="flex items-center gap-3">
      <input 
        type="color" 
        value={props.value}
        onInput={(e) => props.onChange(e.target.value)}
        class="w-8 h-8 p-0 border-0 rounded cursor-pointer"
        style={{ background: "transparent" }}
      />
      <span class="text-sm">{props.label}</span>
    </div>
  );
}

function WorkspaceSettingsForm() {
  const handleExcludeItems = (e: Event) => {
    const val = (e.target as HTMLInputElement).value;
    const items = val.split(",").map(s => s.trim()).filter(Boolean);
    setWorkspaceSettings("excludeItems", items);
    saveWorkspaceSettings();
  };

  const handleRunCommand = (e: Event) => {
    setWorkspaceSettings("runCommand", (e.target as HTMLInputElement).value);
    saveWorkspaceSettings();
  };

  return (
    <div class="flex flex-col pb-12">
      <section class="mb-8">
        <h2 class="text-xl font-semibold mb-2 text-[var(--color-accent)]">File Explorer</h2>
        
        <SettingRow label="Exclude Items" description="Comma-separated list of files and folders to hide from the file tree.">
          <input 
            type="text" 
            value={workspaceSettings.excludeItems.join(", ")}
            onChange={handleExcludeItems}
            placeholder=".git, node_modules"
            class="w-full px-3 py-1.5 rounded-md outline-none border text-sm"
            style={{
              background: "var(--color-bg-secondary)",
              color: "var(--color-fg)",
              "border-color": "var(--color-border)"
            }}
          />
        </SettingRow>
      </section>

      <section class="mb-8">
        <h2 class="text-xl font-semibold mb-2 text-[var(--color-accent)]">Build & Run</h2>
        
        <SettingRow label="Run Command" description="The command executed when clicking the Play button.">
          <input 
            type="text" 
            value={workspaceSettings.runCommand}
            onChange={handleRunCommand}
            placeholder="npm run dev"
            class="w-full px-3 py-1.5 rounded-md outline-none border font-mono text-sm"
            style={{
              background: "var(--color-bg-secondary)",
              color: "var(--color-fg)",
              "border-color": "var(--color-border)"
            }}
          />
        </SettingRow>
      </section>
    </div>
  );
}
