import { createSignal, createEffect, onCleanup } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import type { SearchResult } from "@/types";

export function useWorkspaceSearch(
  rootPath: string | null,
  onClose: () => void,
  onResultClick: (filePath: string) => void,
) {
  const [query, setQuery] = createSignal("");
  const [results, setResults] = createSignal<SearchResult[]>([]);
  const [searching, setSearching] = createSignal(false);
  const [selectedIndex, setSelectedIndex] = createSignal(0);

  createEffect(() => {
    const q = query().trim();
    if (!q) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true); // Show spinner while debouncing

    const timer = setTimeout(() => {
      search();
    }, 250);

    onCleanup(() => clearTimeout(timer));
  });

  async function search() {
    const q = query().trim();
    if (!q || !rootPath) return;

    setSearching(true);
    // Don't clear results immediately so UI doesn't flash empty while typing fast

    try {
      const found: SearchResult[] = await invoke("workspace_search", {
        rootPath,
        query: q,
      });
      setResults(found);
      setSelectedIndex(0); // reset selection on new results
    } catch (err) {
      console.error("Workspace search failed:", err);
    } finally {
      setSearching(false);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (results().length > 0) {
        selectResult(selectedIndex());
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results().length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    }
  }

  function selectResult(index: number) {
    const res = results()[index];
    if (res) {
      onClose();
      onResultClick(res.filePath);
    }
  }

  return {
    query,
    setQuery,
    results,
    searching,
    selectedIndex,
    setSelectedIndex,
    handleKeydown,
    selectResult,
  };
}
