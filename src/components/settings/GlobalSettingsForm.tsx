import { Show } from "solid-js";
import { getAllThemeNames } from "@/features/theme/themes";
import { SettingRow } from "./SettingRow";
import { CustomSelect } from "./CustomSelect";
import { ColorPicker } from "./ColorPicker";
import { FileAssociationsForm } from "./FileAssociationsForm";
import { Input } from "@/components/ui/Input";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";

export function GlobalSettingsForm() {
  const {
    globalSettings,
    settingsStore,
    updateCustomColor,
    handleToggle,
    handleNumber,
    handleText,
    handleZoom,
  } = useGlobalSettings();

  const themeOptions = getAllThemeNames()
    .concat(["custom"])
    .map((t) => ({ label: t, value: t }));

  return (
    <div class="flex flex-col pb-12">
      <section class="mb-8">
        <h2 class="text-xl font-semibold mb-2 text-[var(--color-accent)]">
          Appearance
        </h2>

        <SettingRow
          label="Color Theme"
          description="Select the overall theme for the editor."
        >
          <CustomSelect
            value={globalSettings.theme}
            onChange={(v) => handleText("theme", v)}
            options={themeOptions}
          />
        </SettingRow>

        <Show when={globalSettings.theme === "custom"}>
          <div class="grid grid-cols-2 gap-4 mt-4 p-4 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
            <ColorPicker
              label="Background"
              value={globalSettings.customTheme?.bg || "#0B0F00"}
              onChange={(v) => updateCustomColor("bg", v)}
            />
            <ColorPicker
              label="Secondary Bg"
              value={globalSettings.customTheme?.bgSecondary || "#111a00"}
              onChange={(v) => updateCustomColor("bgSecondary", v)}
            />
            <ColorPicker
              label="Foreground"
              value={globalSettings.customTheme?.fg || "#d4d4d4"}
              onChange={(v) => updateCustomColor("fg", v)}
            />
            <ColorPicker
              label="Accent"
              value={globalSettings.customTheme?.accent || "#CDFF07"}
              onChange={(v) => updateCustomColor("accent", v)}
            />
            <ColorPicker
              label="Border"
              value={globalSettings.customTheme?.border || "#1e2a00"}
              onChange={(v) => updateCustomColor("border", v)}
            />
            <ColorPicker
              label="Error"
              value={globalSettings.customTheme?.error || "#ff4444"}
              onChange={(v) => updateCustomColor("error", v)}
            />
          </div>
        </Show>

        <SettingRow
          label="Default Zoom"
          description="Set the default zoom level for the editor UI."
        >
          <CustomSelect
            value={(
              settingsStore.zoomLevel() ??
              globalSettings.defaultZoom ??
              1
            ).toString()}
            onChange={handleZoom}
            options={[
              { label: "50%", value: "0.5" },
              { label: "60%", value: "0.6" },
              { label: "70%", value: "0.7" },
              { label: "80%", value: "0.8" },
              { label: "90%", value: "0.9" },
              { label: "100%", value: "1" },
              { label: "110%", value: "1.1" },
              { label: "120%", value: "1.2" },
              { label: "130%", value: "1.3" },
              { label: "140%", value: "1.4" },
              { label: "150%", value: "1.5" },
              { label: "175%", value: "1.75" },
              { label: "200%", value: "2" },
            ]}
            width="120px"
          />
        </SettingRow>
      </section>

      <section class="mb-8">
        <h2 class="text-xl font-semibold mb-2 text-[var(--color-accent)]">
          Editor
        </h2>

        <SettingRow
          label="Word Wrap"
          description="Controls whether lines should wrap."
        >
          <input
            type="checkbox"
            checked={globalSettings.wordWrap}
            onChange={(e) => handleToggle("wordWrap", e.currentTarget.checked)}
            class="w-4 h-4 cursor-pointer"
          />
        </SettingRow>

        <SettingRow
          label="Font Size"
          description="Controls the font size in pixels."
        >
          <Input
            type="number"
            value={globalSettings.editorFontSize}
            onChange={(e) =>
              handleNumber("editorFontSize", Number(e.currentTarget.value))
            }
            class="max-w-[120px]"
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
        <h2 class="text-xl font-semibold mb-2 text-[var(--color-accent)]">
          Terminal
        </h2>

        <SettingRow
          label="Terminal Font Size"
          description="Controls the font size in the integrated terminal."
        >
          <Input
            type="number"
            value={globalSettings.terminalFontSize}
            onInput={(e) =>
              handleNumber(
                "terminalFontSize",
                parseInt(e.currentTarget.value) || 12,
              )
            }
            class="w-24"
          />
        </SettingRow>
      </section>

      <section class="mb-8">
        <h2 class="text-xl font-semibold mb-2 text-[var(--color-accent)]">
          File Associations
        </h2>
        <FileAssociationsForm />
      </section>
    </div>
  );
}
