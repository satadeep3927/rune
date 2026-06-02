interface ImageViewerProps {
  dataUrl: string;
  fileName: string;
}

export function ImageViewer(props: ImageViewerProps) {
  return (
    <div
      class="flex items-center justify-center w-full h-full overflow-auto"
      style={{ background: "var(--color-bg)" }}
    >
      <img
        src={props.dataUrl}
        alt={props.fileName}
        style={{
          "max-width": "90%",
          "max-height": "90%",
          "object-fit": "contain",
        }}
      />
    </div>
  );
}
