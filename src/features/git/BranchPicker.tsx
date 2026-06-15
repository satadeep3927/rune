import { Show, For } from "solid-js";
import { GitBranch, ChevronDown, Plus, Check } from "lucide-solid";
import { useBranchPicker } from "@/hooks/useBranchPicker";

interface BranchPickerProps {
  fs: any;
}

export function BranchPicker(props: BranchPickerProps) {
  const {
    gitState,
    isOpen,
    branches,
    toggleOpen,
    handleSelectBranch,
    handleCreateBranch,
  } = useBranchPicker(props.fs);

  return (
    <Show when={gitState() && gitState()?.branch}>
      <div class="relative h-full flex items-center" data-branch-picker>
        <button
          class="h-full flex items-center gap-1.5 px-3 tracking-wide transition-colors text-[12px]"
          classList={{
            "bg-[var(--color-menu-hover)] text-[var(--color-fg)]": isOpen(),
            "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-menu-hover)]":
              !isOpen(),
          }}
          title="Switch Branch"
          onClick={toggleOpen}
        >
          <GitBranch size={12} />
          <span>{gitState()?.branch}</span>
          <ChevronDown size={12} class="opacity-70" />
        </button>

        <Show when={isOpen()}>
          <div
            class="absolute top-full left-0 py-1 z-50 min-w-[220px]"
            style={{
              background: "var(--color-bg-secondary)",
              border: "1px solid var(--color-border)",
              "box-shadow": "0 4px 12px rgba(0,0,0,0.4)",
            }}
          >
            <button
              class="w-full text-left px-4 py-[5px] text-[12px] flex items-center gap-2 transition-colors hover:bg-[var(--color-menu-hover)]"
              style={{ color: "var(--color-fg)" }}
              onClick={handleCreateBranch}
            >
              <Plus size={12} class="opacity-70" />
              <span>Create new branch...</span>
            </button>
            <div
              class="my-1 mx-2"
              style={{ height: "1px", background: "var(--color-border)" }}
            />
            <For each={branches()}>
              {(b) => (
                <button
                  class="w-full text-left px-4 py-[5px] text-[12px] flex items-center gap-2 transition-colors hover:bg-[var(--color-menu-hover)]"
                  style={{ color: "var(--color-fg)" }}
                  onClick={() => handleSelectBranch(b)}
                >
                  <Show
                    when={b === gitState()?.branch}
                    fallback={<div class="w-3" />}
                  >
                    <Check
                      size={12}
                      style={{ color: "var(--color-success)" }}
                    />
                  </Show>
                  <span>{b}</span>
                </button>
              )}
            </For>
          </div>
        </Show>
      </div>
    </Show>
  );
}
