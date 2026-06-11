import { Show, createEffect } from "solid-js";
import { useFindReplace } from "@/hooks/useFindReplace";
import { Input } from "@/components/ui/Input";
import {
  X,
  ChevronUp,
  ChevronDown,
  Replace,
  ReplaceAll,
  ChevronRight,
} from "lucide-solid";

export function FindReplace() {
  const {
    isVisible,
    isReplaceVisible,
    setIsReplaceVisible,
    searchQuery,
    setSearchQuery,
    replaceQuery,
    setReplaceQuery,
    caseSensitive,
    setCaseSensitive,
    useRegex,
    setUseRegex,
    wholeWord,
    setWholeWord,
    matchCount,
    currentMatch,
    executeSearch,
    handleClose,
  } = useFindReplace();

  let searchInputRef: HTMLInputElement | undefined;

  // Auto-focus when it becomes visible
  createEffect(() => {
    if (isVisible() && searchInputRef) {
      setTimeout(() => searchInputRef!.focus(), 50);
    }
  });

  return (
    <Show when={isVisible()}>
      <div
        class="absolute top-22 right-8 z-50 flex gap-1 p-2 rounded-md shadow-xl backdrop-blur-md"
        style={{
          background: "var(--color-bg-secondary)",
          border: "1px solid var(--color-border)",
          width: "400px",
        }}
      >
        {/* Toggle Column */}
        <div class="flex items-center shrink-0">
          <button
            class="p-1 rounded-md hover:bg-[var(--color-bg-tertiary)] text-[var(--color-fg-muted)] transition-colors"
            title="Toggle Replace"
            onClick={() => setIsReplaceVisible(!isReplaceVisible())}
          >
            <ChevronRight
              size={14}
              class="transition-transform duration-200"
              style={{
                transform: isReplaceVisible()
                  ? "rotate(90deg)"
                  : "rotate(0deg)",
              }}
            />
          </button>
        </div>

        {/* Inputs Column */}
        <div class="flex flex-col gap-2 flex-1 min-w-0">
          {/* Search Row */}
          <div class="flex items-center gap-1">
            <Input
              ref={searchInputRef}
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
              placeholder="Find"
              class="flex-1 bg-[var(--color-bg)] border-[var(--color-border)] h-7 text-xs rounded-md"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  executeSearch(e.shiftKey ? "findPrev" : "findNext");
                }
              }}
            />
            <Show when={matchCount() !== 0 || searchQuery() !== ""}>
              <div class="text-[10px] text-[var(--color-fg-muted)] shrink-0 px-1 font-mono">
                {matchCount() === 0
                  ? "No results"
                  : `${currentMatch()} of ${matchCount()}`}
              </div>
            </Show>
            <div class="flex items-center gap-1 shrink-0">
              <button
                class={`p-1 rounded-md hover:bg-[var(--color-bg-tertiary)] transition-colors ${caseSensitive() ? "text-[var(--color-accent)] bg-[var(--color-bg-tertiary)]" : "text-[var(--color-fg-muted)]"}`}
                title="Match Case"
                onClick={() => setCaseSensitive(!caseSensitive())}
              >
                <div class="text-[10px] font-bold">Aa</div>
              </button>
              <button
                class={`p-1 rounded-md hover:bg-[var(--color-bg-tertiary)] transition-colors ${wholeWord() ? "text-[var(--color-accent)] bg-[var(--color-bg-tertiary)]" : "text-[var(--color-fg-muted)]"}`}
                title="Match Whole Word"
                onClick={() => setWholeWord(!wholeWord())}
              >
                <div class="text-[10px] font-bold">\"\"</div>
              </button>
              <button
                class={`p-1 rounded-md hover:bg-[var(--color-bg-tertiary)] transition-colors ${useRegex() ? "text-[var(--color-accent)] bg-[var(--color-bg-tertiary)]" : "text-[var(--color-fg-muted)]"}`}
                title="Use Regular Expression"
                onClick={() => setUseRegex(!useRegex())}
              >
                <div class="text-[10px] font-bold">.*</div>
              </button>
            </div>
            <div class="flex items-center gap-1 shrink-0 ml-1 border-l border-[var(--color-border)] pl-2">
              <button
                class="p-1 rounded-md hover:bg-[var(--color-bg-tertiary)] text-[var(--color-fg-muted)] transition-colors"
                title="Previous Match (Shift+Enter)"
                onClick={() => executeSearch("findPrev")}
              >
                <ChevronUp size={14} />
              </button>
              <button
                class="p-1 rounded-md hover:bg-[var(--color-bg-tertiary)] text-[var(--color-fg-muted)] transition-colors"
                title="Next Match (Enter)"
                onClick={() => executeSearch("findNext")}
              >
                <ChevronDown size={14} />
              </button>
              <button
                class="p-1 rounded-md hover:bg-[var(--color-error)] text-[var(--color-fg-muted)] transition-colors ml-1"
                title="Close"
                onClick={handleClose}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Replace Row */}
          <Show when={isReplaceVisible()}>
            <div class="flex items-center gap-1">
              <Input
                value={replaceQuery()}
                onInput={(e) => setReplaceQuery(e.currentTarget.value)}
                placeholder="Replace"
                class="flex-1 bg-[var(--color-bg)] border-[var(--color-border)] h-7 text-xs rounded-md"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    executeSearch(e.shiftKey ? "replaceAll" : "replace");
                  }
                }}
              />
              <div class="flex items-center gap-1 shrink-0">
                <button
                  class="p-1 rounded-md hover:bg-[var(--color-bg-tertiary)] text-[var(--color-fg-muted)] transition-colors flex items-center gap-1"
                  title="Replace (Enter)"
                  onClick={() => executeSearch("replace")}
                >
                  <Replace size={14} />
                </button>
                <button
                  class="p-1 rounded-md hover:bg-[var(--color-bg-tertiary)] text-[var(--color-fg-muted)] transition-colors flex items-center gap-1"
                  title="Replace All (Shift+Enter)"
                  onClick={() => executeSearch("replaceAll")}
                >
                  <ReplaceAll size={14} />
                </button>
                <div class="w-[52px]" /> {/* Spacer to align with top row */}
              </div>
            </div>
          </Show>
        </div>
      </div>
    </Show>
  );
}
