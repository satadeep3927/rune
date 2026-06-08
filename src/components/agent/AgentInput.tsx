import { createSignal } from "solid-js";
import { Textarea } from "../ui/Textarea";
import { Button } from "../ui/Button";

interface AgentInputProps {
  onSend: (message: string) => void;
}

export function AgentInput(props: AgentInputProps) {
  const [text, setText] = createSignal("");

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function send() {
    const msg = text().trim();
    if (!msg) return;

    props.onSend(msg);
    setText("");
  }

  return (
    <div class="shrink-0 px-3 py-2 border-t border-[var(--color-border)]">
      <div class="flex items-end gap-2 bg-[var(--color-bg-secondary)] rounded-md border border-[var(--color-border)] p-1">
        <Textarea
          rows={1}
          placeholder="Ask anything... (Enter to send, Shift+Enter for newline)"
          value={text()}
          onInput={(e) => setText(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          class="border-none shadow-none focus-visible:ring-0 px-2 py-1.5 min-h-[36px] max-h-[120px] bg-transparent text-[13px] font-mono"
        />
        <Button
          onClick={send}
          variant="primary"
          class="shrink-0 mb-0.5 mr-0.5 px-3 py-1.5"
        >
          Send
        </Button>
      </div>
    </div>
  );
}
