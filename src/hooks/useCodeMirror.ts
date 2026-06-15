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
  EditorSelection,
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
import { gitConflictExtension } from "@/features/editor/gitConflictExtension";
import { createRuneTheme } from "@/features/editor/cmTheme";
import { tabStore } from "@/stores/tabs";
import { globalSettings, settingsStore } from "@/stores/settings";
import { pluginRegistry } from "@/plugins";
import type { ContextMenuItem } from "@/components/ui/ContextMenu";

export function getLanguageExtension(lang: string): Extension {
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

const languageCompartment = new Compartment();
const wordWrapCompartment = new Compartment();
const updateListenerCompartment = new Compartment();

interface UseCodeMirrorOptions {
  containerRef: () => HTMLDivElement | undefined;
  content: () => string;
  language: () => string;
  tabId: () => string | null | undefined;
  isActive?: () => boolean | undefined;
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
      if (update.docChanged && !settingContent) {
        currentContent = update.state.doc.toString();
        options.onChange?.(currentContent);
        scheduleIndexUpdate(currentContent);
      }
      const tId = options.tabId();
      if (tId) {
        editorStateCache.set(tId, update.state);
      }

      if (update.docChanged || update.selectionSet) {
        const query = getSearchQuery(update.state);
        const tId = options.tabId();
        if (query && query.valid && query.search) {
          let count = 0;
          let currentIndex = 0;
          const currentPos = update.state.selection.main.from;
          const cursor = query.getCursor(update.state);
          let m = cursor.next();
          while (!m.done && count < 100) {
            count++;
            if (
              m.value.to <= currentPos ||
              (m.value.from <= currentPos && m.value.to >= currentPos)
            ) {
              currentIndex = count;
            }
            m = cursor.next();
          }
          const finalCount = m.done ? count : "100+";

          if (
            tId &&
            (tabStore.activeTabId() === tId ||
              tabStore.rightActiveTabId() === tId)
          ) {
            window.dispatchEvent(
              new CustomEvent("rune-search-results", {
                detail: {
                  count: finalCount,
                  currentIndex: currentIndex || (count > 0 ? 1 : 0),
                },
              }),
            );
          }
        } else {
          if (
            tId &&
            (tabStore.activeTabId() === tId ||
              tabStore.rightActiveTabId() === tId)
          ) {
            window.dispatchEvent(
              new CustomEvent("rune-search-results", {
                detail: { count: 0, currentIndex: 0 },
              }),
            );
          }
        }
      }
    });
  }

  function buildExtensions(language: string): Extension[] {
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
        {
          key: "Mod-f",
          run: () => {
            window.dispatchEvent(new CustomEvent("rune-editor-find"));
            return true;
          },
          preventDefault: true,
        },
        {
          key: "Mod-h",
          run: () => {
            window.dispatchEvent(new CustomEvent("rune-editor-replace"));
            return true;
          },
          preventDefault: true,
        },
        {
          key: "Mod-Shift-l",
          run: (view) => {
            const state = view.state;
            const sel = state.sliceDoc(state.selection.main.from, state.selection.main.to);
            let queryObj;
            
            if (sel) {
              queryObj = new SearchQuery({ search: sel, caseSensitive: false, regexp: false, wholeWord: false });
              window.dispatchEvent(
                new CustomEvent("rune-search-set-query", {
                  detail: { query: sel },
                }),
              );
            } else {
              queryObj = getSearchQuery(state);
              if (!queryObj || !queryObj.valid || !queryObj.search) {
                return false;
              }
            }

            const cursor = queryObj.getCursor(state);
            let m = cursor.next();
            const ranges = [];
            while (!m.done && ranges.length < 1000) {
              ranges.push(EditorSelection.range(m.value.from, m.value.to));
              m = cursor.next();
            }

            if (ranges.length > 0) {
              const mainIndex = Math.max(0, ranges.findIndex(r => r.from >= state.selection.main.from));
              view.dispatch({
                selection: EditorSelection.create(ranges, mainIndex),
                effects: setSearchQuery.of(queryObj),
                scrollIntoView: true
              });
            }
            return true;
          },
          preventDefault: true
        },
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
      gitConflictExtension(),
      createRuneTheme(),
    ];
  }

  onMount(() => {
    const el = options.containerRef();
    if (!el) return;

    const tId = options.tabId();
    const cached = tId ? editorStateCache.get(tId) : undefined;
    const rawInitialContent = options.content();
    const initialContent = rawInitialContent.replace(/\r\n/g, "\n");
    const exts = buildExtensions(options.language());

    let state: EditorState;
    if (cached) {
      state = cached;
    } else {
      state = EditorState.create({ doc: initialContent, extensions: exts });
    }
    view = new EditorView({ state, parent: el });
    if (cached) {
      view.dispatch({ effects: updateListenerCompartment.reconfigure(getUpdateListener()) });
    }
    if (tId && !cached) {
      editorStateCache.set(tId, view.state);
    }

    view.focus();
    options.onScrollerRef?.(view.scrollDOM);

    const scrollPos = tId ? scrollStateCache.get(tId) : undefined;
    if (scrollPos) {
      requestAnimationFrame(() => {
        if (view) {
          view.scrollDOM.scrollTop = scrollPos.top;
          view.scrollDOM.scrollLeft = scrollPos.left;
        }
      });
    }

    view.scrollDOM.addEventListener("scroll", () => {
      const currentTId = options.tabId();
      if (currentTId && view) {
        scrollStateCache.set(currentTId, {
          top: view.scrollDOM.scrollTop,
          left: view.scrollDOM.scrollLeft,
        });
      }
    });

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
        const { action, query, replaceWith, caseSensitive, regexp, wholeWord } =
          (e as CustomEvent).detail;

        if (action === "clear") {
          view.dispatch({
            effects: setSearchQuery.of(new SearchQuery({ search: "" })),
          });
          view.focus();
          return;
        }

        view.dispatch({
          effects: setSearchQuery.of(
            new SearchQuery({
              search: query || "",
              replace: replaceWith || "",
              caseSensitive: !!caseSensitive,
              regexp: !!regexp,
              wholeWord: !!wholeWord,
            }),
          ),
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
      }
    };
    window.addEventListener("rune-search-execute", searchExecuteHandler);

    findReplaceShortcutHandler = () => {
      const tId = options.tabId();
      if (
        tId &&
        (tabStore.activeTabId() === tId || tabStore.rightActiveTabId() === tId)
      ) {
        if (view) {
          const state = view.state;
          const sel = state.sliceDoc(
            state.selection.main.from,
            state.selection.main.to,
          );
          if (sel && !sel.includes("\n")) {
            window.dispatchEvent(
              new CustomEvent("rune-search-set-query", {
                detail: { query: sel },
              }),
            );
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
      window.removeEventListener(
        "rune-editor-find",
        findReplaceShortcutHandler,
      );
      window.removeEventListener(
        "rune-editor-replace",
        findReplaceShortcutHandler,
      );
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
    if (options.isActive?.() && view) {
      view.focus();
    }
  });

  createEffect(() => {
    // Track dependencies that affect layout
    globalSettings.editorFontSize;
    globalSettings.editorFontFamily;
    settingsStore.zoomLevel();
    
    if (view) {
      // Wait for DOM to actually paint the new CSS variables (requestAnimationFrame is too early)
      setTimeout(() => {
        if (view) {
          // Force CodeMirror to completely invalidate its height cache
          view.dispatch({
            effects: wordWrapCompartment.reconfigure(
              globalSettings.wordWrap ? EditorView.lineWrapping : []
            )
          });
          view.requestMeasure();
        }
      }, 50);
    }
  });

  createEffect(() => {
    const rawContent = options.content();
    const newContent = rawContent.replace(/\r\n/g, "\n");
    if (!view) return;
    if (currentContent === newContent) return;

    currentContent = newContent;
    if (view.state.doc.toString() !== newContent) {
      settingContent = true;
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: newContent },
        annotations: Transaction.addToHistory.of(false),
      });
      settingContent = false;
    }
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
