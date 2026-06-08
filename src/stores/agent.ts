import { createSignal } from "solid-js";
import type { AgentMessage } from "../plugins/types";
import { tabStore } from "./tabs";

let nextSessionId = 1;

interface AgentSessionState {
  id: string;
  providerId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

const [sessions, setSessions] = createSignal<Map<string, AgentSessionState>>(
  new Map(),
);
const [messages, setMessages] = createSignal<Map<string, AgentMessage[]>>(
  new Map(),
);
const [streamingSessionId, setStreamingSessionId] = createSignal<
  string | null
>(null);
const [streamingContent, setStreamingContent] = createSignal("");

function createSessionId(): string {
  return `agent-${Date.now()}-${nextSessionId++}`;
}

function openSession(providerId: string, initialMessage?: string): string {
  const id = createSessionId();
  const now = Date.now();

  setSessions((prev) => {
    const next = new Map(prev);
    next.set(id, {
      id,
      providerId,
      title: initialMessage
        ? initialMessage.slice(0, 50)
        : `Agent Session`,
      createdAt: now,
      updatedAt: now,
    });
    return next;
  });

  setMessages((prev) => {
    const next = new Map(prev);
    next.set(id, []);
    return next;
  });

  tabStore.openTab(
    `agent://${id}`,
    initialMessage
      ? initialMessage.slice(0, 30) +
          (initialMessage.length > 30 ? "..." : "")
      : "Agent",
    "",
    "agent",
    "agent",
    undefined,
    "left",
  );

  if (initialMessage) {
    addMessage(id, {
      id: `msg-${Date.now()}`,
      sessionId: id,
      role: "user",
      content: initialMessage,
      timestamp: now,
    });
  }

  return id;
}

function closeSession(id: string): void {
  setSessions((prev) => {
    const next = new Map(prev);
    next.delete(id);
    return next;
  });
  setMessages((prev) => {
    const next = new Map(prev);
    next.delete(id);
    return next;
  });
}

function addMessage(sessionId: string, message: AgentMessage): void {
  setMessages((prev) => {
    const next = new Map(prev);
    const existing = next.get(sessionId) ?? [];
    next.set(sessionId, [...existing, message]);
    return next;
  });
  setSessions((prev) => {
    const session = prev.get(sessionId);
    if (!session) return prev;
    const next = new Map(prev);
    next.set(sessionId, { ...session, updatedAt: Date.now() });
    return next;
  });
}

function getSessionMessages(sessionId: string): AgentMessage[] {
  return messages().get(sessionId) ?? [];
}

function getSession(sessionId: string): AgentSessionState | undefined {
  return sessions().get(sessionId);
}

function isStreaming(sessionId?: string): boolean {
  if (sessionId) return streamingSessionId() === sessionId;
  return streamingSessionId() !== null;
}

function startStreaming(sessionId: string): void {
  setStreamingSessionId(sessionId);
  setStreamingContent("");
}

function appendStreamChunk(chunk: string): void {
  setStreamingContent((prev) => prev + chunk);
}

function endStreaming(): void {
  const sid = streamingSessionId();
  const content = streamingContent();
  if (sid && content) {
    addMessage(sid, {
      id: `msg-${Date.now()}`,
      sessionId: sid,
      role: "assistant",
      content,
      timestamp: Date.now(),
    });
  }
  setStreamingSessionId(null);
  setStreamingContent("");
}

function parseAgentUri(filePath: string): string | null {
  if (filePath.startsWith("agent://")) {
    return filePath.slice("agent://".length);
  }
  return null;
}

export const agentStore = {
  sessions,
  messages,
  streamingSessionId,
  streamingContent,
  openSession,
  closeSession,
  addMessage,
  getSessionMessages,
  getSession,
  isStreaming,
  startStreaming,
  appendStreamChunk,
  endStreaming,
  parseAgentUri,
};
