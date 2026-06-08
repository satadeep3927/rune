import { AgentChat } from "./AgentChat";
import { AgentInput } from "./AgentInput";
import { useAgent } from "../../hooks/useAgent";

interface AgentViewProps {
  sessionId: string;
}

export function AgentView(props: AgentViewProps) {
  const { providerName, sendMessage } = useAgent(props.sessionId);

  return (
    <div class="flex flex-col h-full bg-[var(--color-bg)]">
      <div class="flex items-center gap-2 px-3 h-[32px] shrink-0 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
        <span class="text-[11px] uppercase tracking-wide text-[var(--color-fg-muted)]">
          {providerName()}
        </span>
      </div>

      <AgentChat sessionId={props.sessionId} />

      <AgentInput onSend={sendMessage} />
    </div>
  );
}
