import { onMount, onCleanup, createEffect } from "solid-js";
import { MergeView } from "@codemirror/merge";
import { EditorView, lineNumbers, highlightActiveLineGutter, drawSelection } from "@codemirror/view";
import { EditorState, Compartment } from "@codemirror/state";
import { history } from "@codemirror/commands";
import { highlightSelectionMatches } from "@codemirror/search";
import { foldGutter, bracketMatching, syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
import { getLanguageExtension } from "@/hooks/useCodeMirror";
import { createRuneTheme } from "@/features/editor/cmTheme";
import { globalSettings } from "@/stores/settings";

interface UseCodeMirrorMergeOptions {
  containerRef: () => HTMLDivElement | undefined;
  originalContent: () => string;
  currentContent: () => string;
  language: () => string;
  tabId: () => string | null | undefined;
  onChange?: (content: string) => void;
}

export function useCodeMirrorMerge(options: UseCodeMirrorMergeOptions) {
  let view: MergeView | undefined;
  let settingContent = false;

  const languageCompartmentA = new Compartment();
  const languageCompartmentB = new Compartment();
  const wordWrapCompartmentA = new Compartment();
  const wordWrapCompartmentB = new Compartment();

  function buildExtensions() {
    return [
      lineNumbers(),
      highlightActiveLineGutter(),
      history(),
      foldGutter(),
      drawSelection(),
      bracketMatching(),
      highlightSelectionMatches({ minSelectionLength: 1 }),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      createRuneTheme(),
    ];
  }

  function getUpdateListenerB() {
    return EditorView.updateListener.of((update) => {
      if (update.docChanged && options.onChange && !settingContent) {
        options.onChange(update.state.doc.toString());
      }
    });
  }

  onMount(() => {
    const el = options.containerRef();
    if (!el) return;

    const lang = options.language();
    const wrapExt = globalSettings.wordWrap ? EditorView.lineWrapping : [];

    view = new MergeView({
      a: {
        doc: options.originalContent(),
        extensions: [
          ...buildExtensions(),
          languageCompartmentA.of(getLanguageExtension(lang)),
          wordWrapCompartmentA.of(wrapExt),
          EditorState.readOnly.of(true),
          EditorView.editable.of(false),
        ]
      },
      b: {
        doc: options.currentContent(),
        extensions: [
          ...buildExtensions(),
          languageCompartmentB.of(getLanguageExtension(lang)),
          wordWrapCompartmentB.of(wrapExt),
          getUpdateListenerB(),
        ]
      },
      parent: el
    });
  });

  onCleanup(() => {
    if (view) {
      view.destroy();
      view = undefined;
    }
  });

  // Handle language updates
  createEffect(() => {
    const lang = options.language();
    if (view && languageCompartmentA.get(view.a.state)) {
      view.a.dispatch({ effects: languageCompartmentA.reconfigure(getLanguageExtension(lang)) });
      view.b.dispatch({ effects: languageCompartmentB.reconfigure(getLanguageExtension(lang)) });
    }
  });

  // Handle word wrap updates
  createEffect(() => {
    if (view) {
      const wrapExt = globalSettings.wordWrap ? EditorView.lineWrapping : [];
      view.a.dispatch({ effects: wordWrapCompartmentA.reconfigure(wrapExt) });
      view.b.dispatch({ effects: wordWrapCompartmentB.reconfigure(wrapExt) });
    }
  });

  // Handle content updates
  createEffect(() => {
    const orig = options.originalContent();
    const curr = options.currentContent();
    if (!view) return;

    if (view.a.state.doc.toString() !== orig) {
      settingContent = true;
      view.a.dispatch({
        changes: { from: 0, to: view.a.state.doc.length, insert: orig }
      });
      settingContent = false;
    }

    if (view.b.state.doc.toString() !== curr) {
      settingContent = true;
      view.b.dispatch({
        changes: { from: 0, to: view.b.state.doc.length, insert: curr }
      });
      settingContent = false;
    }
  });

  return {};
}
