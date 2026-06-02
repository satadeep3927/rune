interface PdfViewerProps {
  dataUrl: string;
  fileName: string;
}

export function PdfViewer(props: PdfViewerProps) {
  return (
    <div
      class="w-full h-full"
      style={{ background: "var(--color-bg)" }}
    >
      <embed
        src={props.dataUrl}
        type="application/pdf"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
        }}
      />
    </div>
  );
}
