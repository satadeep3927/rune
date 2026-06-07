import { createSignal } from "solid-js";
import {
  readDir,
  readTextFile,
  writeTextFile,
  readFile,
  mkdir,
  remove,
  rename,
  watch,
  copyFile,
} from "@tauri-apps/plugin-fs";
import { open } from "@tauri-apps/plugin-dialog";
import { basename } from "@tauri-apps/api/path";
import { invoke } from "@tauri-apps/api/core";
import { workspaceSettings, globalSettings } from "@/stores/settings";
import type { FileEntry, FileType } from "@/types";

function joinPath(...parts: string[]): string {
  const sep = parts[0]?.includes("\\") ? "\\" : "/";
  return parts.join(sep).replace(/[/\\]+/g, sep);
}

const IMAGE_EXTS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "svg",
  "bmp",
  "webp",
  "ico",
  "avif",
]);

function getExt(path: string): string {
  if (!path.includes(".")) return "";
  const lower = path.toLowerCase();
  // Handle double extensions like .blade.php, .d.ts, .module.css
  if (lower.endsWith(".blade.php")) return "blade.php";
  if (lower.endsWith(".d.ts")) return "d.ts";
  if (lower.endsWith(".module.css")) return "module.css";
  return path.split(".").pop()!.toLowerCase();
}

function getFileType(ext: string): FileType {
  const overrides = globalSettings.fileAssociations;
  if (overrides && overrides[ext]) {
    return overrides[ext];
  }

  if (IMAGE_EXTS.has(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (ext === "md" || ext === "mdx") return "markdown";
  return "text";
}

function getMimeType(ext: string): string {
  const map: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    bmp: "image/bmp",
    webp: "image/webp",
    ico: "image/x-icon",
    avif: "image/avif",
    pdf: "application/pdf",
  };
  return map[ext] ?? "application/octet-stream";
}

function arrayBufferToBase64(buffer: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < buffer.byteLength; i++) {
    binary += String.fromCharCode(buffer[i]!);
  }
  return btoa(binary);
}

function fileExtensionToLanguage(ext: string): string {
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    cts: "typescript",
    mts: "typescript",
    js: "javascript",
    jsx: "javascript",
    cjs: "javascript",
    mjs: "javascript",
    json: "json",
    html: "html",
    css: "css",
    rs: "rust",
    py: "python",
    md: "markdown",
    mdx: "markdown",
    toml: "toml",
    yaml: "yaml",
    yml: "yaml",
    txt: "text",
    c: "cpp",
    cpp: "cpp",
    h: "cpp",
    hpp: "cpp",
    java: "java",
    go: "go",
    sql: "sql",
    php: "php",
    xml: "xml",
    vue: "vue",
    sh: "shell",
    bash: "shell",
    "blade.php": "blade",
  };
  return map[ext] ?? "text";
}

// sorting and filtering handled by Rust

const STORAGE_KEY = "rune-last-folder";

const [isWatchingPaused, setWatchingPaused] = createSignal(false);

export function useFileSystem() {
  const isFreshWindow = new URLSearchParams(window.location.search).has(
    "fresh",
  );
  const [rootPath, setRootPath] = createSignal<string | null>(
    isFreshWindow ? null : localStorage.getItem(STORAGE_KEY),
  );
  const [tree, setTree] = createSignal<FileEntry[]>([]);
  const [loading, setLoading] = createSignal(false);

  const activeWatchers = new Map<string, () => void>();

  async function startWatching(dirPath: string) {
    if (activeWatchers.has(dirPath)) return;
    try {
      const unwatchFn = await watch(
        dirPath,
        () => {
          refreshPreservingExpanded();
        },
        { recursive: false, delayMs: 500 },
      );
      activeWatchers.set(dirPath, unwatchFn);
    } catch (e) {
      console.warn(`File watching unavailable for ${dirPath}:`, e);
    }
  }

  function stopWatching(dirPath: string) {
    const unwatchFn = activeWatchers.get(dirPath);
    if (unwatchFn) {
      unwatchFn();
      activeWatchers.delete(dirPath);
    }
  }

  function stopAllWatchers() {
    for (const unwatchFn of activeWatchers.values()) {
      unwatchFn();
    }
    activeWatchers.clear();
  }

  async function readDirectory(dirPath: string): Promise<FileEntry[]> {
    const excludes = workspaceSettings.excludeItems || [];
    const root = rootPath() || dirPath;
    try {
      return await invoke<FileEntry[]>("read_filtered_dir", {
        dirPath,
        rootPath: root,
        excludes,
      });
    } catch (e) {
      console.error("Rust read_filtered_dir error:", e);
      return [];
    }
  }

  async function openFolder() {
    setLoading(true);
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Open Folder",
      });
      if (selected && typeof selected === "string") {
        setRootPath(selected);
        localStorage.setItem(STORAGE_KEY, selected);

        try {
          const { invoke } = await import("@tauri-apps/api/core");
          await invoke("register_window_workspace", { workspace: selected });
        } catch (err) {}

        const entries = await readDirectory(selected);
        setTree(entries);
        startWatching(selected);
      }
    } catch (e) {
      console.error("Failed to open folder:", e);
    } finally {
      setLoading(false);
    }
  }

  function findEntry(
    entries: FileEntry[],
    path: string,
  ): FileEntry | undefined {
    for (const e of entries) {
      if (e.path === path) return e;
      if (e.children) {
        const found = findEntry(e.children, path);
        if (found) return found;
      }
    }
    return undefined;
  }

  function updateTree(
    entries: FileEntry[],
    path: string,
    updater: (e: FileEntry) => FileEntry,
  ): FileEntry[] {
    return entries.map((e) => {
      if (e.path === path) return updater(e);
      if (e.children)
        return { ...e, children: updateTree(e.children, path, updater) };
      return e;
    });
  }

  async function toggleDirectory(dirPath: string) {
    const entry = findEntry(tree(), dirPath);
    if (!entry) return;

    if (entry.isExpanded) {
      // Unwatch when collapsing
      stopWatching(dirPath);
      // Also unwatch all children
      const toRemove: string[] = [];
      activeWatchers.forEach((_, path) => {
        if (path.startsWith(dirPath + (dirPath.includes("\\") ? "\\" : "/"))) {
          toRemove.push(path);
        }
      });
      toRemove.forEach(stopWatching);

      setTree(
        updateTree(tree(), dirPath, (e) => ({ ...e, isExpanded: false })),
      );
    } else {
      const children = entry.children?.length
        ? entry.children
        : await readDirectory(dirPath);

      startWatching(dirPath);

      setTree(
        updateTree(tree(), dirPath, (e) => ({
          ...e,
          children,
          isExpanded: true,
        })),
      );
    }
  }

  async function ensureExpanded(dirPath: string) {
    const entry = findEntry(tree(), dirPath);
    if (!entry || entry.isExpanded) return;
    const children = entry.children?.length
      ? entry.children
      : await readDirectory(dirPath);

    startWatching(dirPath);

    setTree(
      updateTree(tree(), dirPath, (e) => ({
        ...e,
        children,
        isExpanded: true,
      })),
    );
  }

  async function readFileContent(
    filePath: string,
  ): Promise<{ content: string; language: string; fileType: FileType }> {
    const ext = getExt(filePath);
    const fileType = getFileType(ext);

    if (fileType === "image" || fileType === "pdf") {
      const data = await readFile(filePath);
      const mime = getMimeType(ext);
      const base64 = arrayBufferToBase64(data);
      const dataUrl = `data:${mime};base64,${base64}`;
      return { content: dataUrl, language: "", fileType };
    }

    const content = await readTextFile(filePath);
    return {
      content: content,
      language: fileExtensionToLanguage(ext),
      fileType,
    };
  }

  async function writeFileContent(
    filePath: string,
    content: string,
  ): Promise<void> {
    await writeTextFile(filePath, content);
  }

  async function init() {
    const saved = rootPath();
    if (saved) {
      setLoading(true);
      try {
        stopAllWatchers();
        const entries = await readDirectory(saved);
        setTree(entries);
        startWatching(saved);

        try {
          const { invoke } = await import("@tauri-apps/api/core");
          await invoke("register_window_workspace", { workspace: saved });
        } catch (err) {
          console.error("[rune] register_window_workspace error:", err);
        }
      } catch {
        setRootPath(null);
        localStorage.removeItem(STORAGE_KEY);
        stopAllWatchers();
      } finally {
        setLoading(false);
      }
    }
  }

  function collectExpandedPaths(entries: FileEntry[]): Set<string> {
    const result = new Set<string>();
    function walk(list: FileEntry[]) {
      for (const e of list) {
        if (e.isDirectory && e.isExpanded) {
          result.add(e.path);
          if (e.children) walk(e.children);
        }
      }
    }
    walk(entries);
    return result;
  }

  async function refreshPreservingExpanded() {
    if (isWatchingPaused()) return;
    const root = rootPath();
    if (!root) return;
    setLoading(true);
    try {
      const expandedPaths = Array.from(collectExpandedPaths(tree()));
      const excludes = workspaceSettings.excludeItems || [];

      const newTree = await invoke<FileEntry[]>("get_expanded_tree", {
        dirPath: root,
        root,
        expandedPaths,
        excludes,
      });

      setTree(newTree);

      for (const e of expandedPaths) {
        startWatching(e);
      }

      const currentExpanded = collectExpandedPaths(newTree);
      for (const watchedPath of activeWatchers.keys()) {
        if (watchedPath !== root && !currentExpanded.has(watchedPath)) {
          stopWatching(watchedPath);
        }
      }
    } catch (err) {
      console.error("refreshPreservingExpanded error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function createNewFile(parentPath: string, name: string) {
    const parts = name.split("/").filter(Boolean);
    let currentPath = parentPath;

    for (let i = 0; i < parts.length - 1; i++) {
      const dirName = parts[i]!;
      currentPath = joinPath(currentPath, dirName);
      try {
        await mkdir(currentPath);
      } catch {
        /* dir may already exist */
      }
    }

    const fileName = parts[parts.length - 1]!;
    const filePath = joinPath(currentPath, fileName);
    await writeTextFile(filePath, "");
    await refreshPreservingExpanded();
  }

  async function createNewFolder(parentPath: string, name: string) {
    const folderPath = joinPath(parentPath, name);
    await mkdir(folderPath);
    await refreshPreservingExpanded();
  }

  async function deleteFile(filePath: string) {
    await remove(filePath, { recursive: true });
    function removeFromTree(entries: FileEntry[]): FileEntry[] {
      return entries
        .filter((e) => e.path !== filePath)
        .map((e) =>
          e.children ? { ...e, children: removeFromTree(e.children) } : e,
        );
    }
    setTree(removeFromTree(tree()));
  }

  function collapseAll() {
    function collapse(entries: FileEntry[]): FileEntry[] {
      return entries.map((e) => ({
        ...e,
        isExpanded: false,
        children: e.children ? collapse(e.children) : undefined,
      }));
    }
    setTree(collapse(tree()));
  }

  async function renameEntry(oldPath: string, newName: string) {
    const oldName = (await basename(oldPath)) ?? "";
    if (newName === oldName) return;
    const parentDir = oldPath.substring(0, oldPath.length - oldName.length);
    const newPath = joinPath(parentDir, newName);
    await rename(oldPath, newPath);
    function renameInTree(entries: FileEntry[]): FileEntry[] {
      return entries.map((e): FileEntry => {
        if (e.path === oldPath) return { ...e, name: newName, path: newPath };
        if (e.children) return { ...e, children: renameInTree(e.children) };
        return e;
      });
    }
    setTree(renameInTree(tree()));
  }

  async function refreshTree() {
    const root = rootPath();
    if (!root) return;
    setLoading(true);
    try {
      const entries = await readDirectory(root);
      setTree(entries);
    } finally {
      setLoading(false);
    }
  }

  async function openFolderByPath(folderPath: string) {
    setLoading(true);
    try {
      setRootPath(folderPath);
      localStorage.setItem(STORAGE_KEY, folderPath);

      try {
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("register_window_workspace", { workspace: folderPath });
      } catch (err) {
        console.error("[rune] register_window_workspace error:", err);
      }

      const entries = await readDirectory(folderPath);
      setTree(entries);
      startWatching(folderPath);
    } catch (e) {
      console.error("Failed to open folder by path:", e);
    } finally {
      setLoading(false);
    }
  }

  return {
    isWatchingPaused,
    rootPath,
    tree,
    loading,
    openFolder,
    openFolderByPath,
    toggleDirectory,
    ensureExpanded,
    readFileContent,
    writeFileContent,
    createNewFile,
    createNewFolder,
    setWatchingPaused,
    readDirectory,
    refreshTree,
    activeWatchers,
    collapseAll,
    renameEntry,
    deleteFile,
    copyFile,
    init,
  };
}
