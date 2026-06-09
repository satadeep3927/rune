import { createSignal, For, Show } from "solid-js";
import { ChevronDownIcon } from "@/components/ui/icons/ChevronDownIcon";
import { useClickOutside } from "@/hooks/useClickOutside";
import { cn } from "@/utils/cn";

interface CustomSelectProps {
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
  width?: string;
}

export function CustomSelect(props: CustomSelectProps) {
  const [isOpen, setIsOpen] = createSignal(false);
  let containerRef!: HTMLDivElement;

  useClickOutside(
    () => containerRef,
    () => setIsOpen(false),
  );

  const selectedLabel = () =>
    props.options.find((o) => o.value === props.value)?.label || props.value;

  return (
    <div
      ref={containerRef}
      class="relative"
      style={{ width: props.width || "200px" }}
    >
      <div
        class={cn(
          "flex items-center justify-between px-3 py-1.5 rounded-md border cursor-pointer select-none text-sm transition-colors",
          isOpen()
            ? "border-[var(--color-accent)]"
            : "border-[var(--color-border)]",
        )}
        style={{
          background: "var(--color-bg-secondary)",
          color: "var(--color-fg)",
        }}
        onClick={() => setIsOpen(!isOpen())}
      >
        <span class="truncate">{selectedLabel()}</span>
        <ChevronDownIcon
          class={cn(
            "w-3.5 h-3.5 transition-transform",
            isOpen() ? "rotate-180" : "",
          )}
        />
      </div>
      <Show when={isOpen()}>
        <div
          class="absolute z-50 mt-1 w-full rounded-md border shadow-lg overflow-hidden flex flex-col max-h-60 overflow-y-auto"
          style={{
            background: "var(--color-bg-secondary)",
            "border-color": "var(--color-border)",
          }}
        >
          <For each={props.options}>
            {(opt) => (
              <div
                class={cn(
                  "px-3 py-1.5 text-sm cursor-pointer select-none transition-colors",
                  props.value === opt.value
                    ? "text-[var(--color-accent)] bg-[var(--color-bg-tertiary)]"
                    : "text-[var(--color-fg)] bg-transparent hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-fg,white)]",
                )}
                onClick={() => {
                  props.onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                {opt.label}
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
