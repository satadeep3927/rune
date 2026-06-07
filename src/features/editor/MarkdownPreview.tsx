import { useMarkdownPreview } from "@/hooks/useMarkdownPreview";
import { cn } from "@/utils/cn";

interface MarkdownPreviewProps {
  content: string;
  editorScrollElement?: HTMLElement | null;
}

export function MarkdownPreview(props: MarkdownPreviewProps) {
  let previewRef: HTMLDivElement | undefined;

  const { html, handleLinkClick } = useMarkdownPreview(
    () => props.content,
    () => props.editorScrollElement,
    () => previewRef,
  );

  return (
    <div
      ref={previewRef}
      class="markdown-preview w-full h-full overflow-auto p-6 bg-[var(--color-bg)] text-[var(--color-fg)] font-sans text-sm leading-relaxed"
      onClick={handleLinkClick}
      innerHTML={html()}
    />
  );
}
