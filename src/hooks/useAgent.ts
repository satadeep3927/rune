import { createSignal, onMount, onCleanup } from "solid-js";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { agentStore } from "../stores/agent";
import { pluginRegistry } from "../plugins/registry";

export function useAgent(sessionId: string) {
  const [providerName, setProviderName] = createSignal("Agent");
  let unlisteners: UnlistenFn[] = [];

  onMount(async () => {
    const session = agentStore.getSession(sessionId);
    if (session) {
      // In this version of the types, getAgentProvider isn't explicitly on PluginRegistry,
      // but it exists at runtime from the plugin architecture.
      const registry = pluginRegistry as any;
      if (registry.getAgentProvider) {
        const provider = registry.getAgentProvider(session.providerId);
        if (provider) setProviderName(provider.name);
      } else if (registry.getAgentProviders) {
        // Fallback for different plugin API versions
        const providers = registry.getAgentProviders() || [];
        const provider = providers.find((p: any) => p.id === session.providerId);
        if (provider) setProviderName(provider.name);
      }
    }

    const unChunk = await listen<{ sessionId: string; chunk: string }>(
      "agent-stream-chunk",
      (e) => {
        if (e.payload.sessionId === sessionId) {
          agentStore.appendStreamChunk(e.payload.chunk);
        }
      },
    );

    const unDone = await listen<{ sessionId: string }>(
      "agent-stream-done",
      (e) => {
        if (e.payload.sessionId === sessionId) {
          agentStore.endStreaming();
        }
      },
    );

    const unError = await listen<{ sessionId: string; error: string }>(
      "agent-stream-error",
      (e) => {
        if (e.payload.sessionId === sessionId) {
          agentStore.appendStreamChunk(`\n\nError: ${e.payload.error}`);
          agentStore.endStreaming();
        }
      },
    );

    unlisteners = [unChunk, unDone, unError];
  });

  onCleanup(() => {
    for (const fn of unlisteners) fn();
  });

  const sendMessage = (msg: string) => {
    const content = msg.trim();
    if (!content) return;

    agentStore.addMessage(sessionId, {
      id: `msg-${Date.now()}`,
      sessionId: sessionId,
      role: "user",
      content,
      timestamp: Date.now(),
    });

    const session = agentStore.getSession(sessionId);
    if (!session) return;

    const allMessages = agentStore.getSessionMessages(sessionId);
    const chatMessages = allMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const context: any = {
      activeFilePath: undefined,
      activeContent: undefined,
      selection: undefined,
      language: undefined,
      workspaceRoot: undefined,
    } as any;

    agentStore.startStreaming(sessionId);

    const config: any = {
      provider: session.providerId,
      api_key: undefined,
      base_url: undefined,
      model: undefined,
    } as any;

    invoke("agent_chat_stream", {
      sessionId,
      provider: session.providerId,
      messages: chatMessages,
      config,
      context,
    }).catch((err: unknown) => {
      console.error("[agent] stream error:", err);
      agentStore.endStreaming();
    });
  };

  return {
    providerName,
    sendMessage,
  };
}
