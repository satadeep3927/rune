interface PdfViewerProps {
  dataUrl: string;
  fileName: string;
}

export function PdfViewer(props: PdfViewerProps) {
  return (
    <div class="w-full h-full bg-[var(--color-bg)]">
      <embed
        src={props.dataUrl}
        type="application/pdf"
        class="w-full h-full border-none"
      />
    </div>
  );
}
