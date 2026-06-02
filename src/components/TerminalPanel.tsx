import { createSignal, createUniqueId, For, Show, onMount, onCleanup, createEffect } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { listen } from "@tauri-apps/api/event";
import { X, Plus, Terminal as TerminalIcon } from "lucide-solid";
import { globalSettings } from "../stores/settings";
import "xterm/css/xterm.css";

interface TerminalPanelProps {
  onClose: () => void;
  rootPath: string | null;
}

interface TermTab {
  id: string;
  name: string;
}

export function TerminalPanel(props: TerminalPanelProps) {
  const [tabs, setTabs] = createSignal<TermTab[]>([]);
  const [activeTabId, setActiveTabId] = createSignal<string | null>(null);
  const [editingTabId, setEditingTabId] = createSignal<string | null>(null);

  function handleAddTab() {
    const id = createUniqueId();
    const name = "Terminal";
    setTabs((prev) => [...prev, { id, name }]);
    setActiveTabId(id);
  }

  function handleCloseTab(id: string, e?: Event) {
    e?.stopPropagation();
    setTabs((prev) => prev.filter((t) => t.id !== id));
    if (activeTabId() === id) {
      const remaining = tabs();
      if (remaining.length > 0) {
        setActiveTabId(remaining[remaining.length - 1].id);
      } else {
        props.onClose();
      }
    }
    invoke("kill_terminal", { termId: id }).catch(() => {});
  }

  onMount(() => {
    handleAddTab();
  });

  return (
    <div
      class="flex flex-col h-full shrink-0 overflow-hidden"
    >
      {/* Header Toolbar / Tabs */}
      <div
        class="flex items-center pr-2 h-[32px] shrink-0 text-xs select-none overflow-x-auto"
        style={{
          "border-bottom": "1px solid var(--color-border)",
          background: "var(--color-titlebar-bg)",
        }}
      >
        <For each={tabs()}>
          {(tab) => (
            <div
              class="flex items-center h-full pl-2 pr-3 border-r cursor-pointer group"
              style={{
                "border-color": "var(--color-border)",
                background: activeTabId() === tab.id ? "var(--color-bg-secondary)" : "transparent",
                color: activeTabId() === tab.id ? "var(--color-fg)" : "var(--color-fg-muted)",
              }}
              onClick={() => setActiveTabId(tab.id)}
              onDblClick={() => setEditingTabId(tab.id)}
            >
              <TerminalIcon size={12} class="mr-1.5 opacity-70" />
              <Show
                when={editingTabId() === tab.id}
                fallback={<span>{tab.name}</span>}
              >
                <input
                  type="text"
                  value={tab.name}
                  class="bg-transparent border-none outline-none text-[11px] w-20"
                  style={{ color: "var(--color-fg)" }}
                  autofocus
                  onBlur={(e) => {
                    setTabs((prev) => prev.map((t) => (t.id === tab.id ? { ...t, name: e.currentTarget.value || "Terminal" } : t)));
                    setEditingTabId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setTabs((prev) => prev.map((t) => (t.id === tab.id ? { ...t, name: e.currentTarget.value || "Terminal" } : t)));
                      setEditingTabId(null);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </Show>
              <button
                class="ml-2 opacity-0 group-hover:opacity-100 transition-opacity hover:text-[var(--color-error)]"
                onClick={(e) => handleCloseTab(tab.id, e)}
              >
                <X size={12} />
              </button>
            </div>
          )}
        </For>
        <button
          class="h-full px-3 hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-fg)] transition-colors text-[var(--color-fg-muted)]"
          onClick={handleAddTab}
          title="New Terminal"
        >
          <Plus size={14} />
        </button>

        <div class="flex-1" />

        <div class="flex items-center gap-2 pr-2">
          <button
            class="hover:text-[var(--color-error)] transition-colors p-1"
            onClick={props.onClose}
            title="Close Panel"
            style={{ color: "var(--color-fg-muted)" }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Terminal View Divs */}
      <div class="flex-1 relative overflow-hidden min-h-0">
        <For each={tabs().map((t) => t.id)}>
          {(id) => (
            <TerminalInstance
              id={id}
              rootPath={props.rootPath}
              isActive={activeTabId() === id}
              onExit={(exitId) => handleCloseTab(exitId)}
            />
          )}
        </For>
      </div>
    </div>
  );
}

interface TerminalInstanceProps {
  id: string;
  rootPath: string | null;
  isActive: boolean;
  onExit: (id: string) => void;
}

function TerminalInstance(props: TerminalInstanceProps) {
  let terminalRef!: HTMLDivElement;
  let term: Terminal | undefined;
  let fitAddon: FitAddon | undefined;
  let unlistenOutput: (() => void) | undefined;
  let unlistenExit: (() => void) | undefined;

  async function initTerminal() {
    term = new Terminal({
      cursorBlink: true,
      fontSize: globalSettings.terminalFontSize,
      fontFamily: "'FiraCode Nerd Font', 'Fira Code', 'JetBrains Mono', monospace",
      theme: getTerminalTheme(),
      scrollback: 5000,
      convertEol: true,
      allowProposedApi: true,
    });

    fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef);
    fitAddon.fit();

    term.onData((data) => {
      invoke("send_terminal_input", { termId: props.id, input: data }).catch((err) => {
        term?.write(`\r\nError writing to terminal: ${err}\r\n`);
      });
    });

    unlistenOutput = await listen<{ id: string; data: string }>("terminal-output", (event) => {
      if (event.payload.id === props.id) {
        term?.write(event.payload.data);
      }
    });

    unlistenExit = await listen<string>("terminal-exit", (event) => {
      if (event.payload === props.id) {
        props.onExit(props.id);
      }
    });

    const cwd = props.rootPath;
    invoke("start_terminal", { termId: props.id, cwd }).catch((err) => {
      term?.write(`\r\nFailed to start terminal process: ${err}\r\n`);
    });
  }

  function handleRunScriptEvent(e: Event) {
    if (!props.isActive) return;
    const runCommand = (e as CustomEvent).detail;
    invoke("send_terminal_input", { termId: props.id, input: "\x03" });
    setTimeout(() => {
      invoke("send_terminal_input", { termId: props.id, input: runCommand + "\r\n" });
    }, 300);
  }

  onMount(() => {
    initTerminal();
    window.addEventListener("resize", handleResize);
    window.addEventListener("rune-run-script", handleRunScriptEvent);
  });

  onCleanup(() => {
    window.removeEventListener("resize", handleResize);
    window.removeEventListener("rune-run-script", handleRunScriptEvent);
    unlistenOutput?.();
    unlistenExit?.();
    term?.dispose();
  });

  createEffect(() => {
    if (props.isActive) {
      setTimeout(() => fitAddon?.fit(), 10);
    }
  });

  createEffect(() => {
    if (term) {
      term.options.fontSize = globalSettings.terminalFontSize;
      term.options.theme = getTerminalTheme();
      setTimeout(() => fitAddon?.fit(), 10);
    }
  });

  function getTerminalTheme() {
    const root = document.documentElement;
    const style = getComputedStyle(root);
    return {
      background: style.getPropertyValue("--color-bg").trim() || "#0B0F00",
      foreground: style.getPropertyValue("--color-fg").trim() || "#d4d4d4",
      cursor: style.getPropertyValue("--color-accent").trim() || "#CDFF07",
      cursorAccent: "#000000",
      selectionBackground: style.getPropertyValue("--color-accent").trim()
        ? `rgba(255, 255, 255, 0.2)`
        : "rgba(205,255,7,0.3)",
      selectionForeground: "#ffffff",
      black: "#1e1e1e",
      red: "#f44747",
      green: "#6A9955",
      yellow: "#d7ba7d",
      blue: "#569cd6",
      magenta: "#c586c0",
      cyan: "#4ec9b0",
      white: "#d4d4d4",
      brightBlack: "#666666",
      brightRed: "#f44747",
      brightGreen: "#6A9955",
      brightYellow: "#d7ba7d",
      brightBlue: "#569cd6",
      brightMagenta: "#c586c0",
      brightCyan: "#4ec9b0",
      brightWhite: "#ffffff",
    };
  }

  function handleResize() {
    if (props.isActive) {
      fitAddon?.fit();
    }
  }

  return (
    <div
      ref={terminalRef}
      class="absolute inset-0 p-2"
      style={{
        visibility: props.isActive ? "visible" : "hidden",
        "pointer-events": props.isActive ? "auto" : "none",
      }}
    />
  );
}

