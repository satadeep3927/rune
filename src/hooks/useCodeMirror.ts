import { onMount, onCleanup, createEffect } from "solid-js";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLineGutter,
  highlightActiveLine,
  drawSelection,
  rectangularSelection,
  highlightSpecialChars,
  crosshairCursor,
} from "@codemirror/view";
import {
  EditorState,
  Compartment,
  Transaction,
  type Extension,
} from "@codemirror/state";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
  undo,
  redo,
  selectAll,
} from "@codemirror/commands";
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
  type CompletionContext,
  type CompletionResult,
} from "@codemirror/autocomplete";
import { invoke } from "@tauri-apps/api/core";
import {
  searchKeymap,
  highlightSelectionMatches,
  openSearchPanel,
} from "@codemirror/search";
import {
  foldGutter,
  indentOnInput,
  bracketMatching,
  foldKeymap,
  syntaxHighlighting,
  defaultHighlightStyle,
} from "@codemirror/language";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { json } from "@codemirror/lang-json";
import { rust } from "@codemirror/lang-rust";
import { python } from "@codemirror/lang-python";
import { markdown } from "@codemirror/lang-markdown";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { sql } from "@codemirror/lang-sql";
import { php } from "@codemirror/lang-php";
import { xml } from "@codemirror/lang-xml";
import { vue } from "@codemirror/lang-vue";
import { StreamLanguage } from "@codemirror/language";
import { toml } from "@codemirror/legacy-modes/mode/toml";
import { yaml } from "@codemirror/legacy-modes/mode/yaml";
import { shell } from "@codemirror/legacy-modes/mode/shell";
import { go } from "@codemirror/legacy-modes/mode/go";
import { createRuneTheme } from "@/features/editor/cmTheme";
import { tabStore } from "@/stores/tabs";
import { globalSettings } from "@/stores/settings";
import { pluginRegistry } from "@/plugins";
import type { ContextMenuItem } from "@/components/ContextMenu";

function getLanguageExtension(lang: string): Extension {
  switch (lang) {
    case "javascript":
      return javascript({ jsx: true });
    case "typescript":
      return javascript({ typescript: true, jsx: true });
    case "html":
      return html();
    case "css":
      return css();
    case "json":
      return json();
    case "rust":
      return rust();
    case "python":
      return python();
    case "markdown":
      return markdown();
    case "cpp":
      return cpp();
    case "java":
      return java();
    case "sql":
      return sql();
    case "php":
      return php();
    case "xml":
      return xml();
    case "vue":
      return vue();
    case "toml":
      return StreamLanguage.define(toml);
    case "yaml":
      return StreamLanguage.define(yaml);
    case "shell":
      return StreamLanguage.define(shell);
    case "go":
      return StreamLanguage.define(go);
    case "blade":
      return html();
    default:
      return [];
  }
}

async function globalWordCompletion(
  context: CompletionContext,
): Promise<CompletionResult | null> {
  const word = context.matchBefore(/[\w_]+/);
  if (!word || (word.from === word.to && !context.explicit)) return null;

  try {
    const completions: string[] = await invoke("get_completions", {
      query: word.text,
    });
    if (completions.length === 0) return null;

    return {
      from: word.from,
      options: completions.map((c) => ({
        label: c,
        type: "text",
        boost: -1,
      })),
    };
  } catch (e) {
    return null;
  }
}

const editorStateCache = new Map<string, EditorState>();

interface UseCodeMirrorOptions {
  containerRef: () => HTMLDivElement | undefined;
  content: () => string;
  language: () => string;
  tabId: () => string | null | undefined;
  onChange?: (content: string) => void;
  onScrollerRef?: (el: HTMLElement | null) => void;
  setCtxMenu: (
    menu: { x: number; y: number; items: ContextMenuItem[] } | null,
  ) => void;
}

export function useCodeMirror(options: UseCodeMirrorOptions) {
  let view: EditorView | undefined;
  let currentContent = options.content();
  let settingContent = false;
  let lastTabId = options.tabId();

  const languageCompartment = new Compartment();
  const wordWrapCompartment = new Compartment();
  const updateListenerCompartment = new Compartment();

  let updateIndexTimeout: number | undefined;
  let gotoLineHandler: ((e: Event) => void) | undefined;
  let findHandler: ((e: Event) => void) | undefined;

  function scheduleIndexUpdate(content: string) {
    const tId = options.tabId();
    if (!tId) return;
    const tab = tabStore.tabs().find((t) => t.id === tId);
    if (!tab?.filePath) return;

    if (updateIndexTimeout) clearTimeout(updateIndexTimeout);
    updateIndexTimeout = window.setTimeout(() => {
      invoke("update_file_index", { filePath: tab.filePath, content }).catch(
        console.error,
      );
    }, 1000);
  }

  function getUpdateListener() {
    return EditorView.updateListener.of((update) => {
      const tId = options.tabId();
      if (tId) {
        editorStateCache.set(tId, update.state);
      }
      if (update.docChanged && !settingContent) {
        const isUserEdit = update.transactions.some(
          (t) => t.annotation(Transaction.userEvent) !== undefined,
        );
        if (isUserEdit) {
          currentContent = update.state.doc.toString();
          options.onChange?.(currentContent);
          scheduleIndexUpdate(currentContent);
        }
      }
    });
  }

  function buildExtensions(
    initialContent: string,
    language: string,
  ): Extension[] {
    return [
      EditorState.allowMultipleSelections.of(true),
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      foldGutter(),
      drawSelection(),
      indentOnInput(),
      bracketMatching(),
      closeBrackets(),
      autocompletion(),
      EditorState.languageData.of(() => [
        { autocomplete: globalWordCompletion },
      ]),
      rectangularSelection(),
      crosshairCursor(),
      highlightActiveLine(),
      highlightSelectionMatches({ minSelectionLength: 1 }),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      keymap.of([
        { key: "Mod-Shift-z", run: redo, preventDefault: true },
        {
          key: "F12",
          run: (targetView) => {
            const state = targetView.state;
            const pos = state.selection.main.head;
            const word = state.wordAt(pos);
            if (!word) return false;

            const wordStr = state.sliceDoc(word.from, word.to);
            invoke<{ path: string; line: number } | null>("get_definition", {
              symbol: wordStr,
            }).then((sym) => {
              if (sym) {
                window.dispatchEvent(
                  new CustomEvent("rune-open-file", {
                    detail: { path: sym.path },
                  }),
                );
                setTimeout(() => {
                  window.dispatchEvent(
                    new CustomEvent("rune-goto-line-path", {
                      detail: { path: sym.path, line: sym.line },
                    }),
                  );
                }, 150);
              }
            });
            return true;
          },
        },
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...completionKeymap,
        indentWithTab,
      ]),
      languageCompartment.of(getLanguageExtension(language)),
      wordWrapCompartment.of(
        globalSettings.wordWrap ? EditorView.lineWrapping : [],
      ),
      updateListenerCompartment.of(getUpdateListener()),
      createRuneTheme(),
    ];
  }

  onMount(() => {
    const el = options.containerRef();
    if (!el) return;

    let state: EditorState;
    const tId = options.tabId();
    const cached = tId ? editorStateCache.get(tId) : undefined;
    const initialContent = options.content();
    const exts = buildExtensions(initialContent, options.language());

    if (cached) {
      if (cached.doc.toString() === initialContent) {
        state = cached;
      } else {
        state = EditorState.create({ doc: initialContent, extensions: exts });
      }
    } else {
      state = EditorState.create({ doc: initialContent, extensions: exts });
    }

    view = new EditorView({ state, parent: el });

    if (cached) {
      view.dispatch({
        effects: updateListenerCompartment.reconfigure(getUpdateListener()),
      });
    }

    view.focus();
    options.onScrollerRef?.(view.scrollDOM);

    gotoLineHandler = (e: Event) => {
      const { path, line } = (e as CustomEvent).detail;
      const tId = options.tabId();
      const tab = tabStore.tabs().find((t) => t.id === tId);
      if (tab?.filePath === path && view) {
        const doc = view.state.doc;
        if (line >= 1 && line <= doc.lines) {
          const lineInfo = doc.line(line);
          view.dispatch({
            selection: { anchor: lineInfo.from },
            effects: EditorView.scrollIntoView(lineInfo.from, { y: "center" }),
          });
          view.focus();
        }
      }
    };
    window.addEventListener("rune-goto-line-path", gotoLineHandler);

    findHandler = () => {
      const tId = options.tabId();
      if (
        tabStore.activeTabId() === tId ||
        tabStore.rightActiveTabId() === tId
      ) {
        if (view) {
          openSearchPanel(view);
          view.focus();
        }
      }
    };
    window.addEventListener("rune-editor-find", findHandler);
  });

  onCleanup(() => {
    if (updateIndexTimeout) clearTimeout(updateIndexTimeout);
    if (gotoLineHandler) {
      window.removeEventListener("rune-goto-line-path", gotoLineHandler);
    }
    if (findHandler) {
      window.removeEventListener("rune-editor-find", findHandler);
    }
    const tId = options.tabId();
    if (view && tId) {
      editorStateCache.set(tId, view.state);
    }
    view?.destroy();
    view = undefined;
  });

  createEffect(() => {
    const lang = options.language();
    if (view && languageCompartment.get(view.state)) {
      view.dispatch({
        effects: languageCompartment.reconfigure(getLanguageExtension(lang)),
      });
    }
  });

  createEffect(() => {
    if (view) {
      view.dispatch({
        effects: wordWrapCompartment.reconfigure(
          globalSettings.wordWrap ? EditorView.lineWrapping : [],
        ),
      });
    }
  });

  createEffect(() => {
    const newContent = options.content();
    const tId = options.tabId();
    if (!view) return;
    if (currentContent === newContent && tId === lastTabId) return;

    if (tId !== lastTabId) {
      if (lastTabId && view) {
        editorStateCache.set(lastTabId, view.state);
      }

      lastTabId = tId;
      currentContent = newContent;

      const cached = tId ? editorStateCache.get(tId) : undefined;
      let state: EditorState;
      if (cached) {
        if (cached.doc.toString() === newContent) {
          state = cached;
        } else {
          state = EditorState.create({
            doc: newContent,
            extensions: buildExtensions(newContent, options.language()),
          });
        }
      } else {
        state = EditorState.create({
          doc: newContent,
          extensions: buildExtensions(newContent, options.language()),
        });
      }
      view.setState(state);

      if (cached) {
        view.dispatch({
          effects: updateListenerCompartment.reconfigure(getUpdateListener()),
        });
      }
      return;
    }

    currentContent = newContent;
    settingContent = true;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: newContent },
    });
    settingContent = false;
  });

  function handleContextMenu(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!view) return;

    const items: ContextMenuItem[] = [
      {
        label: "Cut",
        action: () => {
          if (!view) return;
          const state = view.state;
          const text = state.sliceDoc(
            state.selection.main.from,
            state.selection.main.to,
          );
          if (text) {
            navigator.clipboard.writeText(text).then(() => {
              if (view) view.dispatch(view.state.replaceSelection(""));
            });
          }
        },
      },
      {
        label: "Copy",
        action: () => {
          if (!view) return;
          const state = view.state;
          const text = state.sliceDoc(
            state.selection.main.from,
            state.selection.main.to,
          );
          if (text) {
            navigator.clipboard.writeText(text);
          }
        },
      },
      {
        label: "Paste",
        action: () => {
          view?.focus();
          if (!view) return;
          navigator.clipboard
            .readText()
            .then((text) => {
              if (!view) return;
              view.dispatch(view.state.replaceSelection(text));
            })
            .catch(() => {
              document.execCommand("paste");
            });
        },
      },
      { separator: true, label: "" },
      {
        label: "Select All",
        action: () => {
          view?.focus();
          if (view) selectAll(view);
        },
      },
      { separator: true, label: "" },
      {
        label: "Undo",
        action: () => {
          view?.focus();
          undo(view!);
        },
      },
      {
        label: "Redo",
        action: () => {
          view?.focus();
          redo(view!);
        },
      },
    ];

    const activeTab = tabStore.getFocusedTab();
    const pluginItems = pluginRegistry.getContextMenuItems("editor", {
      language: activeTab?.language,
      filePath: activeTab?.filePath,
    });
    if (pluginItems.length > 0) {
      items.push({ separator: true, label: "" });
      for (const p of pluginItems) {
        if ("separator" in p && p.separator) {
          items.push({ separator: true, label: "" });
        } else {
          const reg = p as any;
          items.push({
            label: reg.label,
            icon: reg.icon,
            hint: reg.hint,
            action: () =>
              reg.action({
                language: activeTab?.language,
                filePath: activeTab?.filePath,
              }),
          });
        }
      }
    }

    options.setCtxMenu({ x: e.clientX, y: e.clientY, items });
  }

  return { handleContextMenu };
}
