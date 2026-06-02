import { createMemo, onCleanup, onMount } from "solid-js";
import { marked } from "marked";

interface MarkdownPreviewProps {
  content: string;
  editorScrollElement?: HTMLElement | null;
}

export function MarkdownPreview(props: MarkdownPreviewProps) {
  let previewRef: HTMLDivElement | undefined;
  const html = createMemo(() => marked.parse(props.content) as string);

  let syncing = false;

  function syncFromEditor() {
    if (syncing || !previewRef || !props.editorScrollElement) return;
    syncing = true;
    const editor = props.editorScrollElement;
    const ratio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight || 1);
    previewRef.scrollTop = ratio * (previewRef.scrollHeight - previewRef.clientHeight);
    requestAnimationFrame(() => { syncing = false; });
  }

  function syncFromPreview() {
    if (syncing || !previewRef || !props.editorScrollElement) return;
    syncing = true;
    const editor = props.editorScrollElement;
    const ratio = previewRef.scrollTop / (previewRef.scrollHeight - previewRef.clientHeight || 1);
    editor.scrollTop = ratio * (editor.scrollHeight - editor.clientHeight);
    requestAnimationFrame(() => { syncing = false; });
  }

  onMount(() => {
    props.editorScrollElement?.addEventListener("scroll", syncFromEditor);
    previewRef?.addEventListener("scroll", syncFromPreview);
  });

  onCleanup(() => {
    props.editorScrollElement?.removeEventListener("scroll", syncFromEditor);
    previewRef?.removeEventListener("scroll", syncFromPreview);
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

  return (
    <div
      ref={previewRef}
      class="markdown-preview w-full h-full overflow-auto p-6"
      onClick={handleLinkClick}
      style={{
        background: "var(--color-bg)",
        color: "var(--color-fg)",
        "font-family": "'Inter', 'Segoe UI', system-ui, sans-serif",
        "font-size": "14px",
        "line-height": "1.6",
      }}
      innerHTML={html()}
    />
  );
}
