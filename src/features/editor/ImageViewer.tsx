interface ImageViewerProps {
  dataUrl: string;
  fileName: string;
}

export function ImageViewer(props: ImageViewerProps) {
  return (
    <div class="flex items-center justify-center w-full h-full overflow-auto bg-[var(--color-bg)]">
      <img
        src={props.dataUrl}
        alt={props.fileName}
        class="max-w-[90%] max-h-[90%] object-contain"
      />
    </div>
  );
}
