import { createSignal, For, Show } from "solid-js";
import { readDir, readTextFile } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";

interface SearchResult {
  filePath: string;
  fileName: string;
  line: number;
  col: number;
  text: string;
  matchStart: number;
  matchEnd: number;
}

interface WorkspaceSearchProps {
  rootPath: string | null;
  onClose: () => void;
  onResultClick: (filePath: string) => void;
}

function shouldSkip(name: string): boolean {
  return name.startsWith(".") || name === "node_modules" || name === "target" || name === "dist" || name === ".git";
}

const BINARY_EXTS = new Set(["png", "jpg", "jpeg", "gif", "svg", "bmp", "webp", "ico", "pdf", "zip", "tar", "gz", "woff", "woff2", "ttf", "eot", "exe", "dll", "so", "dylib"]);

function isBinary(name: string): boolean {
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
  return BINARY_EXTS.has(ext);
}

export function WorkspaceSearch(props: WorkspaceSearchProps) {
  const [query, setQuery] = createSignal("");
  const [results, setResults] = createSignal<SearchResult[]>([]);
  const [searching, setSearching] = createSignal(false);
  const [selectedIndex, setSelectedIndex] = createSignal(0);
  let inputRef!: HTMLInputElement;

  async function collectFiles(dirPath: string): Promise<string[]> {
    const files: string[] = [];
    try {
      const entries = await readDir(dirPath);
      for (const entry of entries) {
        if (shouldSkip(entry.name)) continue;
        const path = await join(dirPath, entry.name);
        if (entry.isDirectory) {
          files.push(...await collectFiles(path));
        } else if (!isBinary(entry.name)) {
          files.push(path);
        }
      }
    } catch { /* skip unreadable dirs */ }
    return files;
  }

  async function search() {
    const q = query().trim();
    if (!q || !props.rootPath) return;

    setSearching(true);
    setResults([]);
    setSelectedIndex(0);

    try {
      const files = await collectFiles(props.rootPath);
      const found: SearchResult[] = [];

      for (const filePath of files) {
        try {
          const content = await readTextFile(filePath);
          const lines = content.split("\n");
          const fileName = filePath.split(/[\\/]/).pop() ?? "";
          for (let i = 0; i < lines.length && found.length < 500; i++) {
            const line = lines[i]!;
            const idx = line.toLowerCase().indexOf(q.toLowerCase());
            if (idx !== -1) {
              found.push({
                filePath,
                fileName,
                line: i + 1,
                col: idx + 1,
                text: line,
                matchStart: idx,
                matchEnd: idx + q.length,
              });
            }
          }
        } catch { /* skip unreadable files */ }
      }

      setResults(found);
    } finally {
      setSearching(false);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (query().trim()) {
        search();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      props.onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results().length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    }
  }

  function highlightMatch(text: string, start: number, end: number) {
    return (
      <>
        {text.slice(0, start)}
        <span style={{ color: "var(--color-accent)", "font-weight": 600 }}>
          {text.slice(start, end)}
        </span>
        {text.slice(end)}
      </>
    );
  }

  return (
    <div
      class="fixed inset-0 flex justify-center pt-[15%] backdrop-blur-[3px]"
      style={{ "z-index": 200, background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) props.onClose();
      }}
    >
      <div
        class="w-[600px] max-h-[500px] flex flex-col shrink-0 overflow-hidden"
        style={{
          background: "var(--color-bg-secondary)",
          border: "1px solid var(--color-border)",
          "border-radius": "8px",
          "box-shadow": "0 10px 30px rgba(0,0,0,0.5)",
        }}
      >
        <div
          class="flex items-center gap-2 px-3 h-[36px] shrink-0"
          style={{ "border-bottom": "1px solid var(--color-border)" }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" style={{ color: "var(--color-fg-muted)", "flex-shrink": "0" }}>
            <circle cx="7" cy="7" r="5" />
            <line x1="11" y1="11" x2="14" y2="14" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search in workspace..."
            value={query()}
            onInput={(e) => setQuery(e.currentTarget.value)}
            onkeydown={handleKeydown}
            class="w-full bg-transparent outline-none text-[13px]"
            style={{
              color: "var(--color-fg)",
              "font-family": "'Inter', 'Segoe UI', system-ui, sans-serif",
            }}
          />
          {searching() && (
            <span class="text-[11px] shrink-0" style={{ color: "var(--color-fg-muted)" }}>
              Searching...
            </span>
          )}
        </div>
        <div class="flex-1 overflow-y-auto py-1">
          <Show when={results().length > 0}>
            <div class="px-3 py-1 text-[11px]" style={{ color: "var(--color-fg-muted)" }}>
              {results().length} results
            </div>
          </Show>
          <For each={results()}>
            {(result, i) => (
              <button
                class="w-full flex flex-col px-3 py-[5px] text-left transition-colors"
                style={{
                  background: selectedIndex() === i() ? "var(--color-bg-tertiary)" : "transparent",
                  cursor: "pointer",
                  border: "none",
                }}
                onMouseEnter={() => setSelectedIndex(i())}
                onClick={() => {
                  props.onClose();
                  props.onResultClick(result.filePath);
                }}
              >
                <div class="flex items-center gap-2 text-[12px]">
                  <span style={{ color: "var(--color-fg)" }}>{result.fileName}</span>
                  <span style={{ color: "var(--color-fg-muted)" }}>
                    :{result.line}:{result.col}
                  </span>
                </div>
                <div
                  class="text-[11px] truncate"
                  style={{
                    color: "var(--color-fg-muted)",
                    "font-family": "'JetBrains Mono', monospace",
                  }}
                >
                  {highlightMatch(result.text, result.matchStart, result.matchEnd)}
                </div>
              </button>
            )}
          </For>
          <Show when={!searching() && query().trim() && results().length === 0}>
            <div class="px-3 py-4 text-center text-xs" style={{ color: "var(--color-fg-muted)" }}>
              No results found
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
}
