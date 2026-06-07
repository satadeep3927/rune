import { createSignal, onMount, onCleanup } from "solid-js";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

export function useIndexerProgress() {
  const [progress, setProgress] = createSignal("");
  const [isIndexing, setIsIndexing] = createSignal(false);

  onMount(async () => {
    let unlistenProgress: UnlistenFn;
    let unlistenDone: UnlistenFn;

    unlistenProgress = await listen<string>("indexing-progress", (e) => {
      setIsIndexing(true);
      setProgress(e.payload);
    });

    unlistenDone = await listen<string>("indexing-done", (e) => {
      setProgress(e.payload);
      setTimeout(() => setIsIndexing(false), 2000);
    });

    onCleanup(() => {
      if (unlistenProgress) unlistenProgress();
      if (unlistenDone) unlistenDone();
    });
  });

  return {
    progress,
    isIndexing,
  };
}
