import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import type { Extension } from "@codemirror/state";

export function createRuneTheme(): Extension {
  const runeTheme = EditorView.theme({
    "&": {
      backgroundColor: "var(--color-bg)",
      color: "var(--color-fg)",
      fontSize: "var(--editor-font-size, 13px)",
      height: "100%",
    },
    ".cm-content": {
      caretColor: "var(--color-accent)",
      fontFamily:
        'var(--editor-font-family, "JetBrains Mono", "Cascadia Code", "Fira Code", "Consolas", monospace)',
      padding: "4px 0",
      userSelect: "text",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "var(--color-accent)",
      borderLeftWidth: "2px",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
      backgroundColor:
        "color-mix(in srgb, var(--color-accent) 30%, transparent) !important",
    },
    ".cm-content ::selection": {
      backgroundColor:
        "color-mix(in srgb, var(--color-accent) 30%, transparent) !important",
    },
    ".cm-activeLine": {
      backgroundColor: "color-mix(in srgb, var(--color-fg) 5%, transparent)",
    },
    ".cm-selectionMatch": {
      backgroundColor: "rgba(205, 255, 7, 0.25)",
      borderRadius: "2px",
      outline: "1px solid rgba(205, 255, 7, 0.4)",
    },
    "&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket": {
      backgroundColor: "rgba(205, 255, 7, 0.2)",
      outline: "none",
    },
    ".cm-gutters": {
      backgroundColor: "var(--color-bg)",
      color: "var(--color-fg-muted)",
      border: "none",
      borderRight: "1px solid var(--color-border)",
      minWidth: "48px",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "transparent",
      color: "#8b949e",
    },
    ".cm-foldPlaceholder": {
      backgroundColor: "var(--color-bg-tertiary)",
      border: "none",
      color: "var(--color-fg-muted)",
    },
    // Search panel
    ".cm-panels": {
      backgroundColor: "var(--color-bg-secondary)",
      color: "var(--color-fg)",
      borderBottom: "1px solid var(--color-border)",
      padding: "0",
    },
    ".cm-panel.cm-search": {
      display: "none !important",
    },
    ".cm-panel.cm-search input": {
      fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
      fontSize: "12px",
      backgroundColor: "var(--color-bg)",
      color: "var(--color-fg)",
      border: "1px solid var(--color-border)",
      borderRadius: "2px",
      padding: "3px 6px",
      outline: "none",
      lineHeight: "18px",
    },
    ".cm-panel.cm-search input:focus": {
      borderColor: "var(--color-accent)",
    },
    ".cm-panel.cm-search button": {
      fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
      fontSize: "11px",
      backgroundColor: "var(--color-bg-tertiary)",
      color: "var(--color-fg)",
      border: "1px solid var(--color-border)",
      borderRadius: "2px",
      padding: "2px 8px",
      outline: "none",
      cursor: "pointer",
      lineHeight: "18px",
      transition: "background 0.1s",
    },
    ".cm-panel.cm-search button:hover": {
      backgroundColor: "var(--color-bg-secondary)",
      borderColor: "var(--color-accent)",
    },
    ".cm-panel.cm-search button[aria-pressed='true']": {
      backgroundColor: "var(--color-bg-tertiary)",
      borderColor: "var(--color-accent)",
      color: "var(--color-accent)",
    },
    ".cm-panel.cm-search label": {
      fontSize: "11px",
      color: "#8b949e",
      display: "inline-flex",
      alignItems: "center",
      gap: "3px",
    },
    ".cm-panel.cm-search label input[type='checkbox']": {
      accentColor: "var(--color-accent)",
    },
    ".cm-panel.cm-search .cm-button": {
      fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
      fontSize: "11px",
      backgroundColor: "var(--color-bg-tertiary)",
      color: "var(--color-fg)",
      border: "1px solid var(--color-border)",
      borderRadius: "2px",
      padding: "2px 8px",
      outline: "none",
      cursor: "pointer",
    },
    ".cm-panel.cm-search .cm-button:hover": {
      backgroundColor: "var(--color-bg-secondary)",
      borderColor: "var(--color-accent)",
    },
    ".cm-searchMatch": {
      backgroundColor: "rgba(205, 255, 7, 0.18)",
      outline: "none",
    },
    ".cm-searchMatch.cm-searchMatch-selected": {
      backgroundColor: "rgba(205, 255, 7, 0.32)",
    },
    // Tooltips / autocomplete
    ".cm-tooltip": {
      backgroundColor: "var(--color-bg-secondary)",
      border: "1px solid var(--color-border)",
      borderRadius: "2px",
    },
    ".cm-tooltip .cm-tooltip-arrow:before": {
      borderTopColor: "var(--color-border)",
      borderBottomColor: "var(--color-border)",
    },
    ".cm-tooltip .cm-tooltip-arrow:after": {
      borderTopColor: "var(--color-bg-secondary)",
      borderBottomColor: "var(--color-bg-secondary)",
    },
    ".cm-tooltip-autocomplete": {
      "& > ul > li": {
        padding: "4px 10px",
        fontSize: "12px",
        fontFamily:
          '"JetBrains Mono", "Cascadia Code", "Fira Code", "Consolas", monospace',
      },
      "& > ul > li[aria-selected]": {
        backgroundColor: "var(--color-bg-tertiary)",
        color: "var(--color-fg)",
      },
    },
    ".cm-search": {
      display: "none !important",
    },
    ".cm-scroller": {
      overflow: "auto",
      scrollbarWidth: "thin",
      scrollbarColor:
        "var(--color-scrollbar-thumb) var(--color-scrollbar-track)",
    },
  });

  const runeHighlightStyle = HighlightStyle.define([
    { tag: tags.keyword, color: "var(--syntax-keyword)" },
    { tag: tags.variableName, color: "var(--color-fg)" },
    { tag: tags.typeName, color: "var(--syntax-type)" },
    { tag: tags.tagName, color: "var(--syntax-tag)" },
    { tag: tags.propertyName, color: "var(--syntax-property)" },
    { tag: tags.operator, color: "var(--color-fg)" },
    { tag: tags.number, color: "var(--syntax-number)" },
    { tag: tags.string, color: "var(--syntax-string)" },
    { tag: tags.meta, color: "var(--syntax-property)" },
    { tag: tags.comment, color: "var(--color-fg-muted)", fontStyle: "italic" },
    { tag: tags.bool, color: "var(--syntax-number)" },
    { tag: tags.null, color: "var(--syntax-number)" },
    { tag: tags.className, color: "var(--syntax-class)" },
    { tag: tags.definition(tags.variableName), color: "var(--syntax-class)" },
    { tag: tags.function(tags.variableName), color: "var(--syntax-function)" },
    { tag: tags.labelName, color: "var(--syntax-class)" },
    { tag: tags.attributeName, color: "var(--syntax-property)" },
    { tag: tags.attributeValue, color: "var(--syntax-string)" },
    { tag: tags.punctuation, color: "var(--color-fg-muted)" },
    { tag: tags.bracket, color: "var(--color-fg-muted)" },
    { tag: tags.separator, color: "var(--color-fg-muted)" },
  ]);

  return [runeTheme, syntaxHighlighting(runeHighlightStyle)];
}
