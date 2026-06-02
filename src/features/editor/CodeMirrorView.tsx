import { onMount, onCleanup, createEffect, createSignal } from "solid-js";
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightActiveLine, drawSelection, rectangularSelection, highlightSpecialChars } from "@codemirror/view";
import { globalSettings } from "../../stores/settings";
import { EditorState, Compartment, Transaction } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap, indentWithTab, undo, redo, selectAll } from "@codemirror/commands";
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from "@codemirror/autocomplete";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { foldGutter, indentOnInput, bracketMatching, foldKeymap, syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
import { ContextMenu, type ContextMenuItem } from "../../components/ContextMenu";
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
import { createRuneTheme } from "./cmTheme";
import type { Extension } from "@codemirror/state";

function getLanguageExtension(lang: string): Extension {
  switch (lang) {
    case "javascript":
      return javascript({ jsx: true });
    case "typescript":
      return javascript({ typescript: true, jsx: true });
    case "html": return html();
    case "css": return css();
    case "json": return json();
    case "rust": return rust();
    case "python": return python();
    case "markdown": return markdown();
    case "cpp": return cpp();
    case "java": return java();
    case "sql": return sql();
    case "php": return php();
    case "xml": return xml();
    case "vue": return vue();
    case "toml": return StreamLanguage.define(toml);
    case "yaml": return StreamLanguage.define(yaml);
    case "shell": return StreamLanguage.define(shell);
    case "go": return StreamLanguage.define(go);
    case "blade": return html(); // Blade = HTML + @directives + {{ }}
    default: return [];
  }
}

interface CodeMirrorViewProps {
  content: string;
  language: string;
  onChange?: (content: string) => void;
  onScrollerRef?: (el: HTMLElement | null) => void;
  tabId?: string | null;
}

export function CodeMirrorView(props: CodeMirrorViewProps) {
  let containerRef!: HTMLDivElement;
  let view: EditorView | undefined;
  const languageCompartment = new Compartment();
  const wordWrapCompartment = new Compartment();
  let currentContent = props.content;
  let settingContent = false;
  let lastTabId = props.tabId;
  const [ctxMenu, setCtxMenu] = createSignal<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);

  function buildExtensions(): Extension[] {
    return [
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
        rectangularSelection(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        keymap.of([
          { key: "Mod-Shift-z", run: redo, preventDefault: true },
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
          indentWithTab,
        ]),
        languageCompartment.of(getLanguageExtension(props.language)),
        wordWrapCompartment.of(globalSettings.wordWrap ? EditorView.lineWrapping : []),
        createRuneTheme(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !settingContent) {
            const isUserEdit = update.transactions.some((t) =>
              t.annotation(Transaction.userEvent) !== undefined
            );
            if (isUserEdit) {
              currentContent = update.state.doc.toString();
              props.onChange?.(currentContent);
            }
          }
        }),
    ];
  }

  onMount(() => {
    const state = EditorState.create({
      doc: props.content,
      extensions: buildExtensions(),
    });

    view = new EditorView({ state, parent: containerRef });
    view.focus();
    props.onScrollerRef?.(view.scrollDOM);
  });

  onCleanup(() => {
    view?.destroy();
    view = undefined;
  });

  createEffect(() => {
    const lang = props.language;
    if (view && languageCompartment.get(view.state)) {
      view.dispatch({
        effects: languageCompartment.reconfigure(getLanguageExtension(lang)),
      });
    }
  });

  createEffect(() => {
    if (view) {
      view.dispatch({
        effects: wordWrapCompartment.reconfigure(globalSettings.wordWrap ? EditorView.lineWrapping : []),
      });
    }
  });

  createEffect(() => {
    const newContent = props.content;
    const tabId = props.tabId;
    if (!view) return;
    if (currentContent === newContent && tabId === lastTabId) return;

    // Tab switched — reset editor with fresh undo history
    if (tabId !== lastTabId) {
      lastTabId = tabId;
      currentContent = newContent;
      const state = EditorState.create({
        doc: newContent,
        extensions: buildExtensions(),
      });
      view.setState(state);
      return;
    }

    // Same tab, content changed externally
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
      { label: "Cut", action: () => { view?.focus(); document.execCommand("cut"); } },
      { label: "Copy", action: () => { view?.focus(); document.execCommand("copy"); } },
      { label: "Paste", action: () => {
        view?.focus();
        if (!view) return;
        navigator.clipboard.readText().then(text => {
          if (!view) return;
          view.dispatch(view.state.replaceSelection(text));
        }).catch(() => { document.execCommand("paste"); });
      } },
      { separator: true, label: "" },
      { label: "Select All", action: () => { view?.focus(); if (view) selectAll(view); } },
      { separator: true, label: "" },
      { label: "Undo", action: () => { view?.focus(); undo(view!); } },
      { label: "Redo", action: () => { view?.focus(); redo(view!); } },
    ];

    setCtxMenu({ x: e.clientX, y: e.clientY, items });
  }

  return (
    <>
      <div ref={containerRef} class="h-full w-full overflow-hidden" onContextMenu={handleContextMenu} />
      {ctxMenu() && (
        <ContextMenu
          x={ctxMenu()!.x}
          y={ctxMenu()!.y}
          items={ctxMenu()!.items}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </>
  );
}
