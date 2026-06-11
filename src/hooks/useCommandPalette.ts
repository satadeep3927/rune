import { createSignal, createEffect } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { tabStore } from "@/stores/tabs";
import type { CommandItem, WorkspaceSymbol, PaletteMode } from "@/types";

export function useCommandPalette(
  commands: CommandItem[],
  initialPrefix: string | undefined,
  onClose: () => void,
  rootPath: string | null,
) {
  const [rawQuery, setRawQuery] = createSignal(initialPrefix ?? "");
  const [selectedIndex, setSelectedIndex] = createSignal(0);
  const [symbols, setSymbols] = createSignal<WorkspaceSymbol[]>([]);
  const [fileList, setFileList] = createSignal<string[]>([]);
  const [loadingSymbols, setLoadingSymbols] = createSignal(false);

  const mode = (): PaletteMode => {
    const q = rawQuery();
    if (q.startsWith(">")) return "command";
    if (q.startsWith("#")) return "workspace-symbol";
    if (q.startsWith("@")) return "document-symbol";
    return "file";
  };

  const searchText = (): string => {
    const q = rawQuery();
    const m = mode();
    if (
      m === "command" ||
      m === "workspace-symbol" ||
      m === "document-symbol"
    ) {
      return q.slice(1).trim();
    }
    return q.trim();
  };

  const placeholder = (): string => {
    switch (mode()) {
      case "command":
        return "Search commands...";
      case "workspace-symbol":
        return "Search workspace symbols...";
      case "document-symbol":
        return "Go to symbol in editor...";
      case "file":
        return "Go to file...";
    }
  };

  function fetchFiles() {
    const q = searchText();
    if (!q) {
      invoke<string[]>("get_indexed_files", { workspacePath: rootPath })
        .then((files) => setFileList(files.slice(0, 60)))
        .catch(() => setFileList([]));
    } else {
      invoke<string[]>("fuzzy_search_files", {
        query: q,
        workspacePath: rootPath,
      })
        .then((files) => setFileList(files))
        .catch(() => setFileList([]));
    }
  }

  createEffect(() => {
    if (mode() === "file") fetchFiles();
  });

  createEffect(() => {
    const m = mode();
    if (m === "workspace-symbol") {
      setLoadingSymbols(true);
      invoke<WorkspaceSymbol[]>("get_workspace_symbols", {
        query: searchText(),
        workspacePath: rootPath,
      })
        .then((s) => {
          setSymbols(s);
          setSelectedIndex(0);
        })
        .finally(() => setLoadingSymbols(false));
    } else if (m === "document-symbol") {
      const filePath = tabStore.getFocusedTab()?.filePath;
      if (filePath) {
        setLoadingSymbols(true);
        invoke<WorkspaceSymbol[]>("get_document_symbols", { path: filePath })
          .then((s) => {
            setSymbols(s);
            setSelectedIndex(0);
          })
          .finally(() => setLoadingSymbols(false));
      } else {
        setSymbols([]);
      }
    }
  });

  const filteredCommands = () => {
    const q = searchText().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        (c.category ?? "").toLowerCase().includes(q),
    );
  };

  const filteredSymbols = () => {
    const s = symbols();
    if (mode() === "workspace-symbol") return s;

    const q = searchText().toLowerCase();
    if (!q) return s;
    return s.filter((sym) => sym.name.toLowerCase().includes(q));
  };

  const filteredFiles = () => fileList();

  const totalItems = (): number => {
    switch (mode()) {
      case "command":
        return filteredCommands().length;
      case "workspace-symbol":
      case "document-symbol":
        return filteredSymbols().length;
      case "file":
        return filteredFiles().length;
    }
  };

  function executeSelected() {
    const idx = selectedIndex();
    const m = mode();
    if (m === "command") {
      const items = filteredCommands();
      if (items[idx]) {
        onClose();
        items[idx].action();
      }
    } else if (m === "workspace-symbol" || m === "document-symbol") {
      const items = filteredSymbols();
      if (items[idx]) {
        const sym = items[idx];
        onClose();
        window.dispatchEvent(
          new CustomEvent("rune-open-file", { detail: { path: sym.path } }),
        );
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent("rune-goto-line-path", {
              detail: { path: sym.path, line: sym.line },
            }),
          );
        }, 150);
      }
    } else if (m === "file") {
      const items = filteredFiles();
      if (items[idx]) {
        onClose();
        window.dispatchEvent(
          new CustomEvent("rune-open-file", { detail: { path: items[idx] } }),
        );
      }
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    const total = totalItems();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((p) => Math.min(p + 1, Math.max(0, total - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((p) => Math.max(p - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      executeSelected();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }

  return {
    rawQuery,
    setRawQuery,
    selectedIndex,
    setSelectedIndex,
    loadingSymbols,
    mode,
    searchText,
    placeholder,
    filteredCommands,
    filteredSymbols,
    filteredFiles,
    totalItems,
    handleKeydown,
    executeSelected,
    fetchFiles,
  };
}
