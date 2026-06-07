import { createSignal, createEffect, onCleanup, onMount } from "solid-js";
import { invoke } from "@tauri-apps/api/core";

export function useMarkdownPreview(
  content: () => string,
  editorScrollElement: () => HTMLElement | null | undefined,
  previewRef: () => HTMLDivElement | undefined,
) {
  const [html, setHtml] = createSignal("");
  
  createEffect(() => {
    const text = content();
    invoke<string>("parse_markdown", { text }).then(setHtml).catch(console.error);
  });
  
  let syncing = false;

  function syncFromEditor() {
    const editor = editorScrollElement();
    const preview = previewRef();
    if (syncing || !preview || !editor) return;
    syncing = true;

    const ratio =
      editor.scrollTop / (editor.scrollHeight - editor.clientHeight || 1);
    preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight);
    requestAnimationFrame(() => {
      syncing = false;
    });
  }

  function syncFromPreview() {
    const editor = editorScrollElement();
    const preview = previewRef();
    if (syncing || !preview || !editor) return;
    syncing = true;

    const ratio =
      preview.scrollTop / (preview.scrollHeight - preview.clientHeight || 1);
    editor.scrollTop = ratio * (editor.scrollHeight - editor.clientHeight);
    requestAnimationFrame(() => {
      syncing = false;
    });
  }

  onMount(() => {
    const editor = editorScrollElement();
    const preview = previewRef();
    if (editor) editor.addEventListener("scroll", syncFromEditor);
    if (preview) preview.addEventListener("scroll", syncFromPreview);
  });

  onCleanup(() => {
    const editor = editorScrollElement();
    const preview = previewRef();
    if (editor) editor.removeEventListener("scroll", syncFromEditor);
    if (preview) preview.removeEventListener("scroll", syncFromPreview);
  });

  async function handleLinkClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const anchor = target.closest("a");
    if (anchor) {
      const href = anchor.getAttribute("href");
      if (href && (href.startsWith("http://") || href.startsWith("https://"))) {
        e.preventDefault();
        try {
          const { openUrl } = await import("@tauri-apps/plugin-opener");
          await openUrl(href);
        } catch (err) {
          console.error("Failed to open external link:", err);
        }
      }
    }
  }

  return {
    html,
    handleLinkClick,
  };
}
