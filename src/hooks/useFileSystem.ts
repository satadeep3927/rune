import { createSignal } from "solid-js";
import { readDir, readTextFile, writeTextFile, readFile, mkdir, remove, rename, watch } from "@tauri-apps/plugin-fs";
import { open } from "@tauri-apps/plugin-dialog";
import { join, basename } from "@tauri-apps/api/path";
import { workspaceSettings } from "../stores/settings";
import type { FileEntry, FileType } from "../types";

const IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "gif", "svg", "bmp", "webp", "ico"]);

function getExt(path: string): string {
  return path.includes(".") ? path.split(".").pop()!.toLowerCase() : "";
}

function getFileType(ext: string): FileType {
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
  };
  return map[ext] ?? "text";
}

function sortEntries(entries: FileEntry[]): FileEntry[] {
  return entries.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });
}

function shouldSkip(name: string): boolean {
  return workspaceSettings.excludeItems.includes(name);
}

const STORAGE_KEY = "rune-last-folder";

export function useFileSystem() {
  const isFreshWindow = new URLSearchParams(window.location.search).has("fresh");
  const [rootPath, setRootPath] = createSignal<string | null>(
    isFreshWindow ? null : localStorage.getItem(STORAGE_KEY)
  );
  const [tree, setTree] = createSignal<FileEntry[]>([]);
  const [loading, setLoading] = createSignal(false);

  let unwatchFn: (() => void) | null = null;

  async function startWatching(dirPath: string) {
    stopWatching();
    try {
      unwatchFn = await watch(
        dirPath,
        () => { refreshPreservingExpanded(); },
        { recursive: true, delayMs: 500 },
      );
    } catch (e) {
      console.warn("File watching unavailable:", e);
    }
  }

  function stopWatching() {
    if (unwatchFn) { unwatchFn(); unwatchFn = null; }
  }

  async function readDirectory(dirPath: string): Promise<FileEntry[]> {
    const entries = await readDir(dirPath);
    
    const validEntries = entries.filter(e => e.name && !shouldSkip(e.name));
    
    const sep = dirPath.includes("\\") ? "\\" : "/";
    const dirPrefix = dirPath.endsWith(sep) ? dirPath : dirPath + sep;
    
    const fileEntries = validEntries.map((entry) => {
      const name = entry.name!;
      const entryPath = dirPrefix + name;
      return {
        name,
        path: entryPath,
        isDirectory: entry.isDirectory,
        isExpanded: false,
        children: entry.isDirectory ? [] : undefined,
      };
    });

    return sortEntries(fileEntries);
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

  function findEntry(entries: FileEntry[], path: string): FileEntry | undefined {
    for (const e of entries) {
      if (e.path === path) return e;
      if (e.children) {
        const found = findEntry(e.children, path);
        if (found) return found;
      }
    }
    return undefined;
  }

  function updateTree(entries: FileEntry[], path: string, updater: (e: FileEntry) => FileEntry): FileEntry[] {
    return entries.map((e) => {
      if (e.path === path) return updater(e);
      if (e.children) return { ...e, children: updateTree(e.children, path, updater) };
      return e;
    });
  }

  async function toggleDirectory(dirPath: string) {
    const entry = findEntry(tree(), dirPath);
    if (!entry) return;

    if (entry.isExpanded) {
      setTree(updateTree(tree(), dirPath, (e) => ({ ...e, isExpanded: false })));
    } else {
      const children = entry.children?.length
        ? entry.children
        : await readDirectory(dirPath);
      setTree(
        updateTree(tree(), dirPath, (e) => ({
          ...e,
          children,
          isExpanded: true,
        }))
      );
    }
  }

  async function ensureExpanded(dirPath: string) {
    const entry = findEntry(tree(), dirPath);
    if (!entry || entry.isExpanded) return;
    const children = entry.children?.length
      ? entry.children
      : await readDirectory(dirPath);
    setTree(
      updateTree(tree(), dirPath, (e) => ({
        ...e,
        children,
        isExpanded: true,
      }))
    );
  }

  async function readFileContent(filePath: string): Promise<{ content: string; language: string; fileType: FileType }> {
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
    return { content, language: fileExtensionToLanguage(ext), fileType };
  }

  async function writeFileContent(filePath: string, content: string): Promise<void> {
    await writeTextFile(filePath, content);
  }

  async function init() {
    const saved = rootPath();
    if (saved) {
      setLoading(true);
      try {
        const entries = await readDirectory(saved);
        setTree(entries);
        startWatching(saved);
      } catch {
        setRootPath(null);
        localStorage.removeItem(STORAGE_KEY);
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
    const root = rootPath();
    if (!root) return;
    const expandedPaths = collectExpandedPaths(tree());
    const freshEntries = await readDirectory(root);

    async function applyExpanded(entries: FileEntry[]): Promise<FileEntry[]> {
      const result: FileEntry[] = [];
      for (const e of entries) {
        if (e.isDirectory && expandedPaths.has(e.path)) {
          const children = await readDirectory(e.path);
          result.push({
            ...e,
            isExpanded: true,
            children: await applyExpanded(children),
          });
        } else {
          result.push(e);
        }
      }
      return sortEntries(result);
    }

    setTree(await applyExpanded(freshEntries));
  }

  async function createNewFile(parentPath: string, name: string) {
    const parts = name.split("/").filter(Boolean);
    let currentPath = parentPath;

    for (let i = 0; i < parts.length - 1; i++) {
      const dirName = parts[i]!;
      currentPath = (await join(currentPath, dirName)) ?? "";
      try {
        await mkdir(currentPath);
      } catch { /* dir may already exist */ }
    }

    const fileName = parts[parts.length - 1]!;
    const filePath = (await join(currentPath, fileName)) ?? "";
    await writeTextFile(filePath, "");
    await refreshPreservingExpanded();
  }

  async function createNewFolder(parentPath: string, name: string) {
    const folderPath = (await join(parentPath, name)) ?? "";
    await mkdir(folderPath);
    await refreshPreservingExpanded();
  }

  async function deleteFile(filePath: string) {
    await remove(filePath, { recursive: true });
    function removeFromTree(entries: FileEntry[]): FileEntry[] {
      return entries
        .filter((e) => e.path !== filePath)
        .map((e) => (e.children ? { ...e, children: removeFromTree(e.children) } : e));
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
    const newPath = (await join(parentDir, newName)) ?? "";
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
    deleteFile,
    renameEntry,
    collapseAll,
    refreshTree,
    init,
  };
}
