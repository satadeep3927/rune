import { Show, For, createEffect } from "solid-js";
import { agentStore } from "../../stores/agent";
import { AgentMessage } from "./AgentMessage";

interface AgentChatProps {
  sessionId: string;
}

export function AgentChat(props: AgentChatProps) {
  let scrollRef: HTMLDivElement | undefined;

  createEffect(() => {
    const msgs = agentStore.getSessionMessages(props.sessionId);
    // Trigger re-read to reactively scroll on new messages
    if (msgs.length >= 0) {
      requestAnimationFrame(() => {
        if (scrollRef) {
          scrollRef.scrollTop = scrollRef.scrollHeight;
        }
      });
    }
  });

  return (
    <div
      ref={scrollRef}
      class="flex-1 overflow-y-auto px-4 py-3"
      style={{ "scroll-behavior": "smooth" }}
    >
      <Show
        when={agentStore.getSessionMessages(props.sessionId).length > 0}
        fallback={
          <div class="flex items-center justify-center h-full">
            <span
              style={{ color: "var(--color-fg-muted)", "font-size": "13px" }}
            >
              Start a conversation...
            </span>
          </div>
        }
      >
        <For each={agentStore.getSessionMessages(props.sessionId)}>
          {(msg) => <AgentMessage message={msg} />}
        </For>

        <Show when={agentStore.isStreaming(props.sessionId)}>
          <AgentMessage
            message={{
              id: "streaming",
              sessionId: props.sessionId,
              role: "assistant",
              content: agentStore.streamingContent(),
              timestamp: Date.now(),
            }}
            isStreaming
          />
        </Show>
      </Show>
    </div>
  );
}
