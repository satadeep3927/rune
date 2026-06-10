import { For, Show, onMount } from "solid-js";
import { tabStore } from "@/stores/tabs";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import { SYMBOL_ICONS, DEFAULT_ICON, getFileColor } from "@/utils/palette";
import { SearchIcon } from "@/components/ui/icons/SearchIcon";
import { ChevronRightIcon } from "@/components/ui/icons/ChevronRightIcon";
import { DocumentIcon } from "@/components/ui/icons/DocumentIcon";
import { highlightMatch } from "@/utils/text";
import { cn } from "@/utils/cn";
import { Input } from "@/components/ui/Input";
import type { CommandItem } from "@/types";

interface CommandPaletteProps {
  commands: CommandItem[];
  onClose: () => void;
  initialPrefix?: string;
  rootPath: string | null;
}

// ── Shortcut badge renderer ──
function ShortcutBadge(props: { shortcut: string }) {
  const parts = props.shortcut.split("+");
  return (
    <span class="flex items-center gap-0.5 shrink-0 ml-auto pl-4">
      <For each={parts}>
        {(part, i) => (
          <>
            <kbd class="text-[10px] leading-none px-[5px] py-[2px] rounded bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-fg-muted)] font-mono font-medium min-w-[18px] text-center inline-block">
              {part.trim()}
            </kbd>
            <Show when={i() < parts.length - 1}>
              <span class="text-[8px] opacity-40 text-[var(--color-fg-muted)]">
                +
              </span>
            </Show>
          </>
        )}
      </For>
    </span>
  );
}

export function CommandPalette(props: CommandPaletteProps) {
  const {
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
    fetchFiles,
  } = useCommandPalette(props.commands, props.initialPrefix, props.onClose, props.rootPath);

  let inputRef!: HTMLInputElement;
  let listRef!: HTMLDivElement;
  let dialogRef!: HTMLDivElement;

  onMount(() => {
    fetchFiles();
    inputRef?.focus();
    if (props.initialPrefix) {
      const len = props.initialPrefix.length;
      inputRef.setSelectionRange(len, len);
    }
  });

  function scrollTo() {
    requestAnimationFrame(() => {
      const el = listRef?.children[selectedIndex()] as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    });
  }

  function handleBackdropMouseDown(e: MouseEvent) {
    if (dialogRef && !dialogRef.contains(e.target as Node)) props.onClose();
  }

  // ── Mode badge config ──
  const modeBadge = (): { label: string; bg: string } | null => {
    switch (mode()) {
      case "command":
        return { label: "COMMANDS", bg: "var(--color-accent)" };
      case "workspace-symbol":
        return { label: "SYMBOLS", bg: "#b180d7" };
      case "document-symbol":
        return { label: "OUTLINE", bg: "#56b6c2" };
      default:
        return null;
    }
  };

  return (
    <div
      class="fixed inset-0 flex justify-center items-start pt-[14vh] bg-black/45 backdrop-blur-[4px] z-[200]"
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        ref={dialogRef}
        data-command-palette
        class="flex flex-col shrink-0 overflow-hidden w-[580px] max-h-[420px] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[10px] shadow-[0_16px_48px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.04)_inset]"
      >
        {/* ── Input bar ── */}
        <div class="flex items-center px-3 shrink-0 gap-2.5 h-[40px] border-b border-[var(--color-border)]">
          <SearchIcon class="shrink-0 text-[var(--color-fg-muted)] opacity-50" />
          <Show when={modeBadge()}>
            {(badge) => (
              <span
                class="text-[9px] px-[6px] py-[2px] rounded shrink-0 uppercase tracking-wider text-white font-bold"
                style={{ background: badge().bg, "letter-spacing": "0.06em" }}
              >
                {badge().label}
              </span>
            )}
          </Show>
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder()}
            value={rawQuery()}
            onInput={(e) => {
              setRawQuery(e.currentTarget.value);
              setSelectedIndex(0);
            }}
            onKeyDown={(e) => {
              handleKeydown(e);
              if (["ArrowDown", "ArrowUp"].includes(e.key)) scrollTo();
            }}
            class="flex-1 bg-transparent border-none outline-none text-[13px] text-[var(--color-fg)] font-sans caret-[var(--color-accent)] shadow-none"
          />
          <span class="text-[10px] shrink-0 tabular-nums text-[var(--color-fg-muted)] opacity-60">
            {totalItems()}
          </span>
        </div>

        {/* ── Hint bar for empty state ── */}
        <Show when={mode() === "file" && rawQuery() === ""}>
          <div class="flex items-center gap-3 px-3 py-[6px] shrink-0 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
            <span class="text-[10px] text-[var(--color-fg-muted)]">
              <kbd class="text-[9px] px-1 py-px rounded mr-0.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-fg-muted)]">
                &gt;
              </kbd>{" "}
              commands
            </span>
            <span class="text-[10px] text-[var(--color-fg-muted)]">
              <kbd class="text-[9px] px-1 py-px rounded mr-0.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-fg-muted)]">
                #
              </kbd>{" "}
              symbols
            </span>
            <span class="text-[10px] text-[var(--color-fg-muted)]">
              <kbd class="text-[9px] px-1 py-px rounded mr-0.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-fg-muted)]">
                @
              </kbd>{" "}
              outline
            </span>
          </div>
        </Show>

        {/* ── Result list ── */}
        <div ref={listRef} class="flex-1 overflow-y-auto py-0.5">
          {/* Command mode */}
          <Show when={mode() === "command"}>
            <For each={filteredCommands()}>
              {(item, i) => (
                <button
                  class={cn(
                    "w-full flex items-center gap-2.5 px-3 py-[5px] text-[12px] text-left border-none cursor-pointer transition-colors text-[var(--color-fg)]",
                    selectedIndex() === i()
                      ? "bg-[var(--color-bg-tertiary)]"
                      : "bg-transparent",
                  )}
                  onMouseEnter={() => setSelectedIndex(i())}
                  onClick={() => {
                    props.onClose();
                    item.action();
                  }}
                >
                  <ChevronRightIcon class="shrink-0 text-[var(--color-fg-muted)] opacity-40 w-3.5 h-3.5" />
                  <span class="flex-1 truncate">
                    <Show when={item.category}>
                      <span class="text-[var(--color-fg-muted)] font-normal">
                        {item.category}:{" "}
                      </span>
                    </Show>
                    {highlightMatch(item.label, searchText())}
                  </span>
                  <Show when={item.shortcut}>
                    <ShortcutBadge shortcut={item.shortcut!} />
                  </Show>
                </button>
              )}
            </For>
            <Show when={filteredCommands().length === 0}>
              <EmptyState text="No matching commands" />
            </Show>
          </Show>

          {/* Symbol modes */}
          <Show
            when={mode() === "workspace-symbol" || mode() === "document-symbol"}
          >
            <Show when={loadingSymbols()}>
              <EmptyState text="Indexing symbols..." />
            </Show>
            <Show when={!loadingSymbols()}>
              <For each={filteredSymbols()}>
                {(sym, i) => {
                  const icon = SYMBOL_ICONS[sym.kind] ?? DEFAULT_ICON;
                  const fileName = sym.path.split(/[\\/]/).pop() ?? "";
                  return (
                    <button
                      class={cn(
                        "w-full flex items-center gap-2.5 px-3 py-[5px] text-[12px] text-left border-none cursor-pointer transition-colors text-[var(--color-fg)]",
                        selectedIndex() === i()
                          ? "bg-[var(--color-bg-tertiary)]"
                          : "bg-transparent",
                      )}
                      onMouseEnter={() => setSelectedIndex(i())}
                      onClick={() => {
                        props.onClose();
                        window.dispatchEvent(
                          new CustomEvent("rune-open-file", {
                            detail: { path: sym.path },
                          }),
                        );
                        setTimeout(() => {
                          window.dispatchEvent(
                            new CustomEvent("rune-goto-line-path", {
                              detail: { path: sym.path, line: sym.line },
                            }),
                          );
                        }, 150);
                      }}
                    >
                      <span
                        class="flex items-center justify-center shrink-0 rounded text-[9px] font-bold w-[18px] h-[18px] tracking-normal"
                        style={{
                          background: icon.color + "20",
                          color: icon.color,
                        }}
                      >
                        {icon.label}
                      </span>
                      <span class="flex-1 truncate font-medium">
                        {highlightMatch(sym.name, searchText())}
                      </span>
                      <span class="text-[10px] shrink-0 truncate max-w-[200px] text-[var(--color-fg-muted)] opacity-60">
                        {fileName}
                        {mode() === "workspace-symbol" ? `:${sym.line}` : ""}
                      </span>
                    </button>
                  );
                }}
              </For>
              <Show when={filteredSymbols().length === 0}>
                <EmptyState
                  text={
                    mode() === "document-symbol" &&
                    !tabStore.getFocusedTab()?.filePath
                      ? "No active file open"
                      : "No symbols found"
                  }
                />
              </Show>
            </Show>
          </Show>

          {/* File mode */}
          <Show when={mode() === "file"}>
            <For each={filteredFiles()}>
              {(filePath, i) => {
                const fileName = filePath.split(/[\\/]/).pop() ?? "";
                const dirParts = filePath.split(/[\\/]/);
                const dirPath =
                  dirParts.length > 3
                    ? "…/" + dirParts.slice(-3, -1).join("/")
                    : dirParts.slice(0, -1).join("/");
                const color = getFileColor(fileName);
                return (
                  <button
                    class={cn(
                      "w-full flex items-center gap-2.5 px-3 py-[5px] text-[12px] text-left border-none cursor-pointer transition-colors text-[var(--color-fg)]",
                      selectedIndex() === i()
                        ? "bg-[var(--color-bg-tertiary)]"
                        : "bg-transparent",
                    )}
                    onMouseEnter={() => setSelectedIndex(i())}
                    onClick={() => {
                      props.onClose();
                      window.dispatchEvent(
                        new CustomEvent("rune-open-file", {
                          detail: { path: filePath },
                        }),
                      );
                    }}
                  >
                    <DocumentIcon
                      class="shrink-0 opacity-80"
                      style={{ color: color }}
                    />
                    <span class="flex-1 truncate">
                      {highlightMatch(fileName, searchText())}
                    </span>
                    <span class="text-[10px] shrink-0 truncate max-w-[220px] text-[var(--color-fg-muted)] opacity-50">
                      {dirPath}
                    </span>
                  </button>
                );
              }}
            </For>
            <Show when={filteredFiles().length === 0}>
              <EmptyState
                text={
                  searchText()
                    ? "No matching files"
                    : "Open a workspace to search files"
                }
              />
            </Show>
          </Show>
        </div>

        {/* ── Footer bar ── */}
        <div class="flex items-center justify-between px-3 shrink-0 h-[28px] border-t border-[var(--color-border)] bg-[var(--color-bg)]">
          <span class="text-[10px] flex items-center gap-2 text-[var(--color-fg-muted)] opacity-50">
            <span>↑↓ navigate</span>
            <span>↵ open</span>
            <span>esc close</span>
          </span>
          <span class="text-[9px] tracking-wider uppercase font-semibold text-[var(--color-fg-muted)] opacity-35">
            Rune
          </span>
        </div>
      </div>
    </div>
  );
}

function EmptyState(props: { text: string }) {
  return (
    <div class="px-4 py-6 text-center text-[11px] text-[var(--color-fg-muted)] opacity-70">
      {props.text}
    </div>
  );
}
