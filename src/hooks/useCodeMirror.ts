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
  highlightSelectionMatches,
  setSearchQuery,
  SearchQuery,
  findNext,
  findPrevious,
  replaceNext,
  replaceAll,
  getSearchQuery,
  selectMatches,
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
import type { ContextMenuItem } from "@/components/ui/ContextMenu";

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
const scrollStateCache = new Map<string, { top: number; left: number }>();

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
  let searchExecuteHandler: ((e: Event) => void) | undefined;
  let findReplaceShortcutHandler: ((e: Event) => void) | undefined;

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

      if (update.docChanged || update.selectionSet) {
        const query = getSearchQuery(update.state);
        if (query && query.valid && query.search) {
          let count = 0;
          let currentIndex = 0;
          const currentPos = update.state.selection.main.from;
          const cursor = query.getCursor(update.state);
          let m = cursor.next();
          while (!m.done && count < 999) {
            count++;
            if (m.value.to <= currentPos || (m.value.from <= currentPos && m.value.to >= currentPos)) {
              currentIndex = count;
            }
            m = cursor.next();
          }
          const finalCount = m.done ? count : "999+";
          
          if (tId && (tabStore.activeTabId() === tId || tabStore.rightActiveTabId() === tId)) {
            window.dispatchEvent(new CustomEvent("rune-search-results", {
              detail: { count: finalCount, currentIndex: currentIndex || (count > 0 ? 1 : 0) }
            }));
          }
        } else {
          if (tId && (tabStore.activeTabId() === tId || tabStore.rightActiveTabId() === tId)) {
            window.dispatchEvent(new CustomEvent("rune-search-results", {
              detail: { count: 0, currentIndex: 0 }
            }));
          }
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
        { key: "Mod-Shift-l", run: selectMatches, preventDefault: true },
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

    searchExecuteHandler = (e: Event) => {
      const tId = options.tabId();
      if (
        tabStore.activeTabId() === tId ||
        tabStore.rightActiveTabId() === tId
      ) {
        if (!view) return;
        const { action, query, replaceWith, caseSensitive, regexp, wholeWord } = (e as CustomEvent).detail;
        
        if (action === "clear") {
          view.dispatch({ effects: setSearchQuery.of(new SearchQuery({ search: "" })) });
          view.focus();
          return;
        }

        // Always update query before executing
        view.dispatch({ 
          effects: setSearchQuery.of(new SearchQuery({ 
            search: query || "", 
            replace: replaceWith || "",
            caseSensitive: !!caseSensitive, 
            regexp: !!regexp, 
            wholeWord: !!wholeWord 
          })) 
        });

        if (action === "findNext") {
           findNext(view);
        } else if (action === "findPrev") {
           findPrevious(view);
        } else if (action === "replace") {
           replaceNext(view);
        } else if (action === "replaceAll") {
           replaceAll(view);
        }
        // Do not call view.focus() here, otherwise the search input loses focus on every keystroke
      }
    };
    window.addEventListener("rune-search-execute", searchExecuteHandler);

    findReplaceShortcutHandler = () => {
      const tId = options.tabId();
      if (tId && (tabStore.activeTabId() === tId || tabStore.rightActiveTabId() === tId)) {
        if (view) {
          const state = view.state;
          const sel = state.sliceDoc(state.selection.main.from, state.selection.main.to);
          if (sel && !sel.includes("\n")) {
            window.dispatchEvent(new CustomEvent("rune-search-set-query", { detail: { query: sel }}));
          }
        }
      }
    };
    window.addEventListener("rune-editor-find", findReplaceShortcutHandler);
    window.addEventListener("rune-editor-replace", findReplaceShortcutHandler);
  });

  onCleanup(() => {
      if (updateIndexTimeout) clearTimeout(updateIndexTimeout);
      if (gotoLineHandler) {
        window.removeEventListener("rune-goto-line-path", gotoLineHandler);
      }
      if (searchExecuteHandler) {
        window.removeEventListener("rune-search-execute", searchExecuteHandler);
      }
      if (findReplaceShortcutHandler) {
        window.removeEventListener("rune-editor-find", findReplaceShortcutHandler);
        window.removeEventListener("rune-editor-replace", findReplaceShortcutHandler);
      }
      const tId = options.tabId();
      if (view && tId) {
        editorStateCache.set(tId, view.state);
      scrollStateCache.set(tId, {
        top: view.scrollDOM.scrollTop,
        left: view.scrollDOM.scrollLeft,
      });
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
        scrollStateCache.set(lastTabId, {
          top: view.scrollDOM.scrollTop,
          left: view.scrollDOM.scrollLeft,
        });
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
      
      const scrollPos = tId ? scrollStateCache.get(tId) : undefined;
      if (scrollPos) {
        requestAnimationFrame(() => {
          if (view) {
            view.scrollDOM.scrollTop = scrollPos.top;
            view.scrollDOM.scrollLeft = scrollPos.left;
          }
        });
      } else {
        requestAnimationFrame(() => {
          if (view) {
            view.scrollDOM.scrollTop = 0;
            view.scrollDOM.scrollLeft = 0;
          }
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
