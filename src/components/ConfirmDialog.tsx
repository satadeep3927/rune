import { Show, onMount } from "solid-js";

interface ConfirmDialogProps {
  message: string;
  detail?: string;
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
            {props.message}
          </p>
          <Show when={props.detail}>
            <p class="text-xs" style={{ color: "var(--color-fg-muted)" }}>
              {props.detail}
            </p>
          </Show>
        </div>
        <div class="flex justify-end gap-2.5 pt-1">
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
            Cancel
          </button>
          <button
            class="px-3 py-1.5 text-xs rounded transition-colors"
            style={{
              background: "rgba(255, 68, 68, 0.15)",
              color: "var(--color-error)",
              border: "1px solid var(--color-error)",
              cursor: "pointer",
            }}
            onClick={props.onConfirm}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-error)";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 68, 68, 0.15)";
              e.currentTarget.style.color = "var(--color-error)";
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
