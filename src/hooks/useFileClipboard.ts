import { createSignal } from "solid-js";
import { invoke } from "@tauri-apps/api/core";

export type ClipboardAction = "copy" | "cut";

export function useFileClipboard() {
  const [internalPaths, setInternalPaths] = createSignal<string[]>([]);
  const [action, setAction] = createSignal<ClipboardAction>("copy");

  async function handleCopy(paths: string[]) {
    if (paths.length === 0) return;
    setInternalPaths(paths);
    setAction("copy");
    await invoke("write_clipboard_files", { paths }).catch(console.error);
  }

  async function handleCut(paths: string[]) {
    if (paths.length === 0) return;
    setInternalPaths(paths);
    setAction("cut");
    await invoke("write_clipboard_files", { paths }).catch(console.error);
  }

  async function handlePaste(destinationFolder: string) {
    try {
      const sysFiles: string[] = await invoke<string[]>("read_clipboard_files").catch(
        () => [],
      );

      let pathsToPaste = sysFiles;
      let currentAction = "copy" as ClipboardAction;

      if (
        internalPaths().length > 0 &&
        sysFiles.length === internalPaths().length &&
        sysFiles.every((f, i) => f === internalPaths()[i])
      ) {
        pathsToPaste = internalPaths();
        currentAction = action();
      }

      if (pathsToPaste.length === 0) return;

      if (currentAction === "cut") {
        await invoke("batch_move_files", {
          paths: pathsToPaste,
          destDir: destinationFolder,
        });
        setInternalPaths([]);
      } else {
        await invoke("batch_copy_files", {
          paths: pathsToPaste,
          destDir: destinationFolder,
        });
      }
    } catch (err) {
      console.error("Paste failed:", err);
    }
  }

  return {
    internalPaths,
    action,
    handleCopy,
    handleCut,
    handlePaste,
  };
}
