import { Show, For, createSignal, onMount } from "solid-js";

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
  const [values, setValues] = createSignal<Record<string, string>>({});
  let firstInputRef!: HTMLInputElement;

  onMount(() => {
    const initialValues: Record<string, string> = {};
    for (const field of props.fields) {
      initialValues[field.id] = field.defaultValue || "";
    }
    setValues(initialValues);
    firstInputRef?.focus();
  });

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      props.onCancel();
    } else if (e.key === "Enter") {
      e.preventDefault();
      props.onConfirm(values());
    }
  }

  const okText = () => props.okLabel || "OK";
  const cancelText = () => props.cancelLabel || "Cancel";

  return (
    <div
      class="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[3px]"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={props.onCancel}
      onkeydown={handleKeydown}
    >
      <div
        class="flex flex-col gap-5 p-5 min-w-[320px] max-w-[400px] rounded-lg"
        style={{
          background: "var(--color-bg-secondary)",
          border: "1px solid var(--color-border)",
          "box-shadow": "0 10px 30px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div class="space-y-1.5">
          <p class="text-sm font-semibold" style={{ color: "var(--color-fg)" }}>
            {props.title}
          </p>
          <Show when={props.message}>
            <p class="text-xs" style={{ color: "var(--color-fg-muted)" }}>
              {props.message}
            </p>
          </Show>
        </div>
        
        <div class="flex flex-col gap-3">
          <For each={props.fields}>
            {(field, index) => (
              <div class="flex flex-col gap-1.5">
                <label class="text-xs" style={{ color: "var(--color-fg-muted)" }}>
                  {field.label}
                </label>
                <input
                  ref={(el) => {
                    if (index() === 0) firstInputRef = el;
                  }}
                  type={field.type || "text"}
                  placeholder={field.placeholder}
                  value={values()[field.id] || ""}
                  onInput={(e) => setValues({ ...values(), [field.id]: e.currentTarget.value })}
                  class="px-2 py-1.5 text-xs rounded outline-none w-full"
                  style={{
                    background: "var(--color-bg-tertiary)",
                    color: "var(--color-fg)",
                    border: "1px solid var(--color-border)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-accent, #CDFF07)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-border)";
                  }}
                />
              </div>
            )}
          </For>
        </div>

        <div class="flex justify-end gap-2.5 pt-1">
          <button
            class="px-3 py-1.5 text-xs rounded transition-colors"
            style={{
              background: "var(--color-bg-tertiary)",
              color: "var(--color-fg-muted)",
              border: "1px solid var(--color-border)",
              cursor: "pointer",
            }}
            onClick={props.onCancel}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--color-fg)";
              e.currentTarget.style.borderColor = "var(--color-fg-muted)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--color-fg-muted)";
              e.currentTarget.style.borderColor = "var(--color-border)";
            }}
          >
            {cancelText()}
          </button>
          
          <button
            class="px-3 py-1.5 text-xs rounded transition-colors font-semibold"
            style={{
              background: "var(--color-accent-dim, rgba(205, 255, 7, 0.15))",
              color: "var(--color-accent, #CDFF07)",
              border: "1px solid var(--color-accent, #CDFF07)",
              cursor: "pointer",
            }}
            onClick={() => props.onConfirm(values())}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-accent, #CDFF07)";
              e.currentTarget.style.color = "var(--color-bg, #000000)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--color-accent-dim, rgba(205, 255, 7, 0.15))";
              e.currentTarget.style.color = "var(--color-accent, #CDFF07)";
            }}
          >
            {okText()}
          </button>
        </div>
      </div>
    </div>
  );
}
