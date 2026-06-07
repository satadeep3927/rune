import {
  globalSettings,
  setGlobalSettings,
  saveGlobalSettings,
  settingsStore,
} from "@/stores/settings";

export function useGlobalSettings() {
  const updateCustomColor = (key: string, val: string) => {
    setGlobalSettings("customTheme", (prev) => ({ ...prev, [key]: val }));
    saveGlobalSettings();
  };

  const handleToggle = (key: "wordWrap", checked: boolean) => {
    setGlobalSettings(key, checked);
    saveGlobalSettings();
  };

  const handleNumber = (
    key: "editorFontSize" | "terminalFontSize",
    val: number,
  ) => {
    setGlobalSettings(key, val);
    saveGlobalSettings();
  };

  const handleText = (key: "editorFontFamily" | "theme", val: string) => {
    setGlobalSettings(key, val);
    saveGlobalSettings();
  };

  const handleZoom = (val: string) => {
    settingsStore.setZoomTo(parseFloat(val));
  };

  return {
    globalSettings,
    settingsStore,
    updateCustomColor,
    handleToggle,
    handleNumber,
    handleText,
    handleZoom,
  };
}
