import { createSignal } from "solid-js";
import {
  globalSettings,
  setGlobalSettings,
  saveGlobalSettings,
} from "@/stores/settings";

export type FileAssociationType = "text" | "image" | "pdf" | "markdown";

export function useFileAssociations() {
  const [newExt, setNewExt] = createSignal("");
  const [newType, setNewType] = createSignal<FileAssociationType>("text");

  const associations = () => globalSettings.fileAssociations || {};
  const entries = () => Object.entries(associations());

  const handleAdd = () => {
    let ext = newExt().trim().toLowerCase();
    if (!ext) return;
    if (ext.startsWith(".")) ext = ext.slice(1);

    setGlobalSettings("fileAssociations", (prev) => ({
      ...(prev || {}),
      [ext]: newType(),
    }));
    saveGlobalSettings();
    setNewExt("");
  };

  const handleRemove = (ext: string) => {
    setGlobalSettings("fileAssociations", (prev) => {
      const next = { ...prev } as Record<string, any>;
      delete next[ext];
      return next;
    });
    saveGlobalSettings();
  };

  return {
    newExt,
    setNewExt,
    newType,
    setNewType,
    entries,
    handleAdd,
    handleRemove,
  };
}
