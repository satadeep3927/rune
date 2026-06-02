import { onMount, onCleanup } from "solid-js";
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightActiveLine, drawSelection, rectangularSelection, highlightSpecialChars } from "@codemirror/view";
import { EditorState, Compartment } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from "@codemirror/autocomplete";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { foldGutter, indentOnInput, bracketMatching, foldKeymap, syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
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
import type { Extension } from "@codemirror/state";

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
    default:
      return [];
  }
}

interface UseCodeMirrorOptions {
  container: HTMLElement;
  initialContent?: string;
  language?: string;
  theme?: Extension;
  wordWrap?: boolean;
  onChange?: (content: string) => void;
}

export function useCodeMirror(options: UseCodeMirrorOptions) {
  let view: EditorView | undefined;
  const languageCompartment = new Compartment();
  const themeCompartment = new Compartment();
  const wordWrapCompartment = new Compartment();

  onMount(() => {
    const state = EditorState.create({
      doc: options.initialContent ?? "",
      extensions: [
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
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
          indentWithTab,
        ]),
        languageCompartment.of(getLanguageExtension(options.language ?? "text")),
        themeCompartment.of(options.theme ?? []),
        wordWrapCompartment.of(options.wordWrap ? EditorView.lineWrapping : []),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && options.onChange) {
            options.onChange(update.state.doc.toString());
          }
        }),
      ],
    });

    view = new EditorView({
      state,
      parent: options.container,
    });

    view.focus();
  });

  onCleanup(() => {
    view?.destroy();
    view = undefined;
  });

  function setContent(content: string) {
    if (!view) return;
    const current = view.state.doc.toString();
    if (current === content) return;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: content },
    });
  }

  function setLanguage(language: string) {
    if (!view) return;
    view.dispatch({
      effects: languageCompartment.reconfigure(getLanguageExtension(language)),
    });
  }

  function setTheme(theme: Extension) {
    if (!view) return;
    view.dispatch({
      effects: themeCompartment.reconfigure(theme),
    });
  }

  function setWordWrap(enabled: boolean) {
    if (!view) return;
    view.dispatch({
      effects: wordWrapCompartment.reconfigure(enabled ? EditorView.lineWrapping : []),
    });
  }

  function getContent(): string {
    return view?.state.doc.toString() ?? "";
  }

  function focus() {
    view?.focus();
  }

  return { setContent, setLanguage, setTheme, setWordWrap, getContent, focus };
}
