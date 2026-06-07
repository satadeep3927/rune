import { onMount, onCleanup, createEffect } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { listen } from "@tauri-apps/api/event";
import { globalSettings } from "@/stores/settings";
import { throttle } from "@/utils/throttle";

export function useTerminalInstance(
  id: string,
  rootPath: string | null,
  isActive: () => boolean,
  onExit: (id: string) => void,
) {
  let terminalRef!: HTMLDivElement;
  let term: Terminal | undefined;
  let fitAddon: FitAddon | undefined;
  let unlistenOutput: (() => void) | undefined;
  let unlistenExit: (() => void) | undefined;
  let resizeObserver: ResizeObserver | undefined;

  const throttledFit = throttle(() => {
    if (isActive() && fitAddon) {
      try {
        fitAddon.fit();
      } catch (e) {
        // Ignore fit issues during layout updates
      }
    }
  }, 100);

  function getTerminalTheme() {
    const root = document.documentElement;
    const style = getComputedStyle(root);
    return {
      background: style.getPropertyValue("--color-bg").trim() || "#0B0F00",
      foreground: style.getPropertyValue("--color-fg").trim() || "#d4d4d4",
      cursor: style.getPropertyValue("--color-accent").trim() || "#CDFF07",
      cursorAccent: "#000000",
      selectionBackground: "rgba(128, 128, 128, 0.4)",
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

  async function initTerminal() {
    term = new Terminal({
      cursorBlink: true,
      fontSize: globalSettings.terminalFontSize,
      fontFamily:
        "'FiraCode Nerd Font', 'Fira Code', 'JetBrains Mono', monospace",
      theme: getTerminalTheme(),
      scrollback: 10000,
      convertEol: true,
      allowProposedApi: true,
      smoothScrollDuration: 0,
    });

    term.attachCustomKeyEventHandler((arg) => {
      const isModifier = arg.ctrlKey || arg.metaKey;
      if (isModifier && arg.code === "KeyC" && arg.type === "keydown") {
        const selection = term!.getSelection();
        if (selection) {
          navigator.clipboard.writeText(selection);
          return false;
        }
      }
      return true;
    });

    fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef);

    try {
      fitAddon.fit();
    } catch (e) {
      console.warn("Could not fit terminal on open:", e);
    }

    term.onResize(({ cols, rows }) => {
      invoke("resize_terminal", { termId: id, cols, rows }).catch(() => {});
    });

    term.onData((data) => {
      invoke("send_terminal_input", { termId: id, input: data }).catch(
        (err) => {
          term?.write(`\r\nError writing to terminal: ${err}\r\n`);
        },
      );
    });

    unlistenOutput = await listen<{ id: string; data: string }>(
      "terminal-output",
      (event) => {
        if (event.payload.id === id) {
          term?.write(event.payload.data);
        }
      },
    );

    unlistenExit = await listen<string>("terminal-exit", (event) => {
      if (event.payload === id) {
        onExit(id);
      }
    });

    const cwd = rootPath;
    invoke("start_terminal", {
      termId: id,
      cwd,
      cols: term.cols,
      rows: term.rows,
    }).catch((err) => {
      term?.write(`\r\nFailed to start terminal process: ${err}\r\n`);
    });
  }

  function handleRunScriptEvent(e: Event) {
    if (!isActive()) return;
    const runCommand = (e as CustomEvent).detail;
    invoke("send_terminal_input", { termId: id, input: "\x03" });
    setTimeout(() => {
      invoke("send_terminal_input", {
        termId: id,
        input: runCommand + "\r\n",
      });
    }, 300);
  }

  function handleContextMenu(e: MouseEvent) {
    e.preventDefault();
    if (!term) return;
    const selection = term.getSelection();
    if (selection) {
      navigator.clipboard.writeText(selection).then(() => {
        term?.clearSelection();
      });
    } else {
      navigator.clipboard.readText().then((text) => {
        if (text) {
          invoke("send_terminal_input", { termId: id, input: text }).catch(
            console.error,
          );
        }
      });
    }
  }

  function handleResize() {
    throttledFit();
  }

  onMount(() => {
    initTerminal();
    window.addEventListener("resize", handleResize);
    window.addEventListener("rune-run-script", handleRunScriptEvent);
    terminalRef?.addEventListener("contextmenu", handleContextMenu);

    resizeObserver = new ResizeObserver(() => {
      throttledFit();
    });
    if (terminalRef) {
      resizeObserver.observe(terminalRef);
    }
  });

  onCleanup(() => {
    window.removeEventListener("resize", handleResize);
    window.removeEventListener("rune-run-script", handleRunScriptEvent);
    terminalRef?.removeEventListener("contextmenu", handleContextMenu);
    resizeObserver?.disconnect();
    unlistenOutput?.();
    unlistenExit?.();
    term?.dispose();
  });

  createEffect(() => {
    if (isActive()) {
      requestAnimationFrame(() => requestAnimationFrame(() => fitAddon?.fit()));
    }
  });

  createEffect(() => {
    globalSettings.theme;
    if (term) {
      term.options.fontSize = globalSettings.terminalFontSize;
      term.options.theme = getTerminalTheme();
      setTimeout(() => fitAddon?.fit(), 10);
    }
  });

  createEffect((prevPath?: string | null) => {
    const currentPath = rootPath;
    if (currentPath && prevPath && currentPath !== prevPath) {
      invoke("send_terminal_input", {
        termId: id,
        input: `cd "${currentPath}"\r\n`,
      }).catch(console.warn);
    }
    return currentPath;
  }, rootPath);

  return {
    setTerminalRef: (el: HTMLDivElement) => {
      terminalRef = el;
    },
    focus: () => term?.focus(),
  };
}
