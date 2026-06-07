import { createSignal } from "solid-js";
import {
  workspaceSettings,
  setWorkspaceSettings,
  saveWorkspaceSettings,
} from "@/stores/settings";

export function useWorkspaceSettings() {
  const [newExt, setNewExt] = createSignal("");
  const [newCmd, setNewCmd] = createSignal("");

  const handleExcludeItems = (e: Event) => {
    const val = (e.target as HTMLInputElement).value;
    const items = val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setWorkspaceSettings("excludeItems", items);
    saveWorkspaceSettings();
  };

  const handleRunCommand = (e: Event) => {
    setWorkspaceSettings(
      "runCommand",
      (e.currentTarget as HTMLInputElement).value,
    );
    saveWorkspaceSettings();
  };

  const updateRunMapVal = (ext: string, cmd: string) => {
    setWorkspaceSettings("runMap", (prev) => ({ ...prev, [ext]: cmd }));
    saveWorkspaceSettings();
  };

  const removeRunMapVal = (ext: string) => {
    setWorkspaceSettings("runMap", (prev) => {
      const copy = { ...prev };
      delete copy[ext];
      return copy;
    });
    saveWorkspaceSettings();
  };

  const addRunMapVal = () => {
    const ext = newExt().trim();
    const cmd = newCmd().trim();
    if (!ext || !cmd) return;
    const formattedExt = ext.startsWith(".") ? ext : `.${ext}`;
    setWorkspaceSettings("runMap", (prev) => ({
      ...prev,
      [formattedExt]: cmd,
    }));
    saveWorkspaceSettings();
    setNewExt("");
    setNewCmd("");
  };

  return {
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
  };
}
