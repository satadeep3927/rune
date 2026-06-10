import { Show, For, createSignal, onMount } from "solid-js";
import { Button } from "./Button";
import { Input } from "./Input";

export interface PromptField {
  id: string;
  label: string;
  type?: "text" | "password";
  placeholder?: string;
  defaultValue?: string;
}

export interface PromptDialogProps {
  title: string;
  message?: string;
  fields: PromptField[];
  okLabel?: string;
  cancelLabel?: string;
  onConfirm: (values: Record<string, string>) => void;
  onCancel: () => void;
}

export function PromptDialog(props: PromptDialogProps) {
  let firstInputRef!: HTMLInputElement;
  const [values, setValues] = createSignal<Record<string, string>>({});

  onMount(() => {
    // Initialize default values
    const initial: Record<string, string> = {};
    for (const field of props.fields) {
      initial[field.id] = field.defaultValue ?? "";
    }
    setValues(initial);

    setTimeout(() => {
      if (firstInputRef) {
        firstInputRef.focus();
        if (firstInputRef.select) firstInputRef.select();
      }
    }, 50);
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      props.onCancel();
    } else if (e.key === "Enter") {
      props.onConfirm(values());
    }
  };

  return (
    <>
      <div 
        class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={props.onCancel}
      />
      
      <div 
        class="fixed top-[15%] left-1/2 -translate-x-1/2 z-50 w-full max-w-md bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onKeyDown={handleKeyDown}
      >
        <div class="px-5 py-4">
          <h2 class="text-lg font-semibold text-[var(--color-fg)] mb-2">
            {props.title}
          </h2>
          
          <Show when={props.message}>
            <p class="text-sm text-[var(--color-fg-muted)] mb-4">
              {props.message}
            </p>
          </Show>

          <div class="flex flex-col gap-4 mt-2">
            <For each={props.fields}>
              {(field, index) => (
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-medium text-[var(--color-fg-muted)]">
                    {field.label}
                  </label>
                  <Input
                    ref={(el) => {
                      if (index() === 0) firstInputRef = el;
                    }}
                    type={field.type || "text"}
                    placeholder={field.placeholder}
                    value={values()[field.id] || ""}
                    onInput={(e) => setValues(prev => ({ ...prev, [field.id]: e.currentTarget.value }))}
                    class="w-full"
                  />
                </div>
              )}
            </For>
          </div>
        </div>

        <div class="px-5 py-3 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border)] flex items-center justify-end gap-2">
          <Button 
            variant="secondary" 
            onClick={props.onCancel}
          >
            {props.cancelLabel || "Cancel"}
          </Button>
          <Button 
            variant="primary" 
            onClick={() => props.onConfirm(values())}
          >
            {props.okLabel || "OK"}
          </Button>
        </div>
      </div>
    </>
  );
}
