import { For, Show, onMount } from "solid-js";
import { useQuickPick } from "@/hooks/useQuickPick";
import { Input } from "@/components/ui/Input";
import { cn } from "@/utils/cn";
import type { QuickPickItem } from "@/types";

interface QuickPickProps {
  items: QuickPickItem[];
  placeholder?: string;
  onSelect: (id: string | undefined) => void;
}

export function QuickPick(props: QuickPickProps) {
  const {
    filter,
    setFilter,
    selectedIndex,
    setSelectedIndex,
    filteredItems,
    handleKeydown,
    selectItem,
  } = useQuickPick(
    props.items,
    (id) => props.onSelect(id),
    () => props.onSelect(undefined),
  );

  let inputRef!: HTMLInputElement;
  let listRef!: HTMLDivElement;
  let dialogRef!: HTMLDivElement;

  onMount(() => {
    inputRef?.focus();
  });

  function handleBackdropMouseDown(e: MouseEvent) {
    if (dialogRef && !dialogRef.contains(e.target as Node)) {
      props.onSelect(undefined);
    }
  }

  function scrollToSelected() {
    requestAnimationFrame(() => {
      const el = listRef?.children[selectedIndex()] as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    });
  }

  return (
    <div
      data-quickpick
      class="fixed inset-0 flex justify-center pt-[15%] backdrop-blur-[3px] bg-black/50 z-[200]"
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        ref={dialogRef}
        class="w-[520px] max-h-[400px] flex flex-col shrink-0 overflow-hidden bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
      >
        <div class="flex items-center px-3 h-[36px] shrink-0 border-b border-[var(--color-border)]">
          <Input
            ref={inputRef}
            type="text"
            placeholder={props.placeholder ?? "Search..."}
            value={filter()}
            onInput={(e) => {
              setFilter(e.currentTarget.value);
              setSelectedIndex(0);
            }}
            onKeyDown={(e) => {
              handleKeydown(e);
              scrollToSelected();
            }}
            class="w-full bg-transparent border-none outline-none text-[13px] text-[var(--color-fg)] font-sans"
          />
        </div>
        <div ref={listRef} class="flex-1 overflow-y-auto py-1">
          <For each={filteredItems()}>
            {(item, i) => (
              <button
                class={cn(
                  "w-full flex items-center justify-between px-3 py-[6px] text-[12px] text-left transition-colors border-none cursor-pointer",
                  selectedIndex() === i()
                    ? "bg-[var(--color-bg-tertiary)] text-[var(--color-fg)]"
                    : "bg-transparent text-[var(--color-fg)]",
                )}
                onMouseEnter={() => setSelectedIndex(i())}
                onClick={() => selectItem(i())}
              >
                <div class="flex flex-col">
                  <span>{item.label}</span>
                  <Show when={item.detail}>
                    <span class="text-[10px] mt-0.5 text-[var(--color-fg-muted)]">
                      {item.detail}
                    </span>
                  </Show>
                </div>
              </button>
            )}
          </For>
          <Show when={filteredItems().length === 0}>
            <div class="px-3 py-4 text-center text-xs text-[var(--color-fg-muted)]">
              No matching items
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
}
