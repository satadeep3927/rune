import { Show, onMount } from "solid-js";

interface ConfirmDialogProps {
  message: string;
  detail?: string;
  okLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "danger";
  hideCancel?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog(props: ConfirmDialogProps) {
  let cancelButtonRef!: HTMLButtonElement;

  onMount(() => {
    cancelButtonRef?.focus();
  });

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      props.onCancel();
    }
  }

  const okText = () => props.okLabel || "OK";
  const cancelText = () => props.cancelLabel || "Cancel";
  const variant = () => props.variant || "primary";

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
        <div class="space-y-1.5 max-h-[60vh] overflow-y-auto pr-2">
          <p class="text-sm font-semibold" style={{ color: "var(--color-fg)" }}>
            {props.message}
          </p>
          <Show when={props.detail}>
            <p class="text-xs whitespace-pre-wrap" style={{ color: "var(--color-fg-muted)" }}>
              {props.detail}
            </p>
          </Show>
        </div>
        <div class="flex justify-end gap-2.5 pt-1">
          <Show when={!props.hideCancel}>
            <button
              ref={cancelButtonRef}
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
          </Show>
          <button
            class="px-3 py-1.5 text-xs rounded transition-colors font-semibold"
            style={{
              background:
                variant() === "danger"
                  ? "rgba(255, 68, 68, 0.15)"
                  : "var(--color-accent-dim, rgba(205, 255, 7, 0.15))",
              color:
                variant() === "danger"
                  ? "var(--color-error)"
                  : "var(--color-accent, #CDFF07)",
              border:
                variant() === "danger"
                  ? "1px solid var(--color-error)"
                  : "1px solid var(--color-accent, #CDFF07)",
              cursor: "pointer",
            }}
            onClick={props.onConfirm}
            onMouseEnter={(e) => {
              if (variant() === "danger") {
                e.currentTarget.style.background = "var(--color-error)";
                e.currentTarget.style.color = "#ffffff";
              } else {
                e.currentTarget.style.background =
                  "var(--color-accent, #CDFF07)";
                e.currentTarget.style.color = "var(--color-bg, #000000)";
              }
            }}
            onMouseLeave={(e) => {
              if (variant() === "danger") {
                e.currentTarget.style.background = "rgba(255, 68, 68, 0.15)";
                e.currentTarget.style.color = "var(--color-error)";
              } else {
                e.currentTarget.style.background =
                  "var(--color-accent-dim, rgba(205, 255, 7, 0.15))";
                e.currentTarget.style.color = "var(--color-accent, #CDFF07)";
              }
            }}
          >
            {okText()}
          </button>
        </div>
      </div>
    </div>
  );
}
