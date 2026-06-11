import { Show } from "solid-js";
import type { AgentMessage } from "../../stores/agent";

interface AgentMessageProps {
  message: AgentMessage;
  isStreaming?: boolean;
}

export function AgentMessage(props: AgentMessageProps) {
  const isUser = () => props.message.role === "user";

  return (
    <div
      class="mb-3"
      style={{
        "max-width": "100%",
      }}
    >
      <div
        class="px-3 py-2 text-[13px] whitespace-pre-wrap break-words"
        style={{
          background: isUser()
            ? "var(--color-bg-tertiary)"
            : "var(--color-bg-secondary)",
          "border-left": isUser()
            ? "2px solid var(--color-accent)"
            : "2px solid transparent",
          "border-radius": "0 2px 2px 0",
          color: "var(--color-fg)",
          "font-family": "var(--font-mono, monospace)",
          "line-height": "1.5",
        }}
      >
        {props.message.content}
        <Show when={props.isStreaming}>
          <span
            class="inline-block w-[6px] h-[14px] ml-0.5 animate-pulse"
            style={{ background: "var(--color-accent)" }}
          />
        </Show>
      </div>
    </div>
  );
}
