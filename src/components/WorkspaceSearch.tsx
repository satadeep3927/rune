import { Show, onMount } from "solid-js";
import { useWorkspaceSearch } from "@/hooks/useWorkspaceSearch";
import { SearchIcon } from "@/components/ui/icons/SearchIcon";
import { SpinnerIcon } from "@/components/ui/icons/SpinnerIcon";
import { Input } from "@/components/ui/Input";
import { cn } from "@/utils/cn";

interface WorkspaceSearchProps {
  onClose: () => void;
  rootPath: string | null;
  onResultClick: (filePath: string) => void;
}

export function WorkspaceSearch(props: WorkspaceSearchProps) {
  const {
    query,
    setQuery,
    results,
    searching,
    selectedIndex,
    setSelectedIndex,
    handleKeydown,
    selectResult,
  } = useWorkspaceSearch(props.rootPath, props.onClose, props.onResultClick);

  let inputRef: HTMLInputElement | undefined;

  onMount(() => {
    inputRef?.focus();
  });

  return (
    <div
      class="fixed inset-0 flex justify-center items-start pt-[14vh] bg-black/45 backdrop-blur-[4px] z-[200]"
      onClick={props.onClose}
    >
      <div
        class="flex flex-col shrink-0 overflow-hidden w-[580px] max-h-[420px] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[10px] shadow-[0_16px_48px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.04)_inset]"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="flex items-center px-3 shrink-0 gap-2.5 h-[40px] border-b border-[var(--color-border)]">
          <SearchIcon class="shrink-0 text-[var(--color-fg-muted)] opacity-50 w-4 h-4" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search workspace..."
            value={query()}
            onInput={(e) => setQuery(e.currentTarget.value)}
            onKeyDown={handleKeydown}
            class="flex-1 bg-transparent border-none outline-none text-[13px] text-[var(--color-fg)] font-sans caret-[var(--color-accent)] shadow-none"
          />
          <Show when={searching()}>
            <SpinnerIcon class="w-3.5 h-3.5 text-[var(--color-accent)] opacity-80" />
          </Show>
        </div>

        <div class="flex-1 overflow-y-auto py-0.5">
          <Show when={results().length === 0 && query().trim() && !searching()}>
            <div class="px-4 py-6 text-center text-[11px] text-[var(--color-fg-muted)] opacity-70">
              No results found
            </div>
          </Show>

          {results().map((res, i) => (
            <div
              class={cn(
                "w-full flex flex-col gap-1 px-3 py-[6px] text-left border-none cursor-pointer transition-colors",
                selectedIndex() === i
                  ? "bg-[var(--color-bg-tertiary)]"
                  : "bg-transparent",
              )}
              onClick={() => {
                setSelectedIndex(i);
                selectResult(i);
              }}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <div class="text-[12px] text-[var(--color-fg)] flex items-center justify-between">
                <span class="font-medium truncate text-[var(--color-fg)]">{res.fileName}</span>
                <span class="text-[10px] text-[var(--color-fg-muted)] opacity-60 shrink-0">
                  {res.line}:{res.col}
                </span>
              </div>
              <div class="text-[11px] font-mono text-[var(--color-fg-muted)] truncate opacity-80 pl-2 border-l border-[var(--color-border)]">
                <span>{res.text.slice(0, res.matchStart)}</span>
                <span class="text-[var(--color-accent)] font-bold">
                  {res.text.slice(res.matchStart, res.matchEnd)}
                </span>
                <span>{res.text.slice(res.matchEnd)}</span>
              </div>
            </div>
          ))}
        </div>

        <div class="flex items-center justify-between px-3 shrink-0 h-[28px] border-t border-[var(--color-border)] bg-[var(--color-bg)]">
          <span class="text-[10px] flex items-center gap-2 text-[var(--color-fg-muted)] opacity-50">
            <span>↑↓ navigate</span>
            <span>↵ open</span>
            <span>esc close</span>
          </span>
          <span class="text-[9px] tracking-wider uppercase font-semibold text-[var(--color-fg-muted)] opacity-35">
            Rune Search
          </span>
        </div>
      </div>
    </div>
  );
}
