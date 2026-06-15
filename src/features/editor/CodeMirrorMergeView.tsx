import { useCodeMirrorMerge } from "./useCodeMirrorMerge";
import { settingsStore } from "@/stores/settings";

interface CodeMirrorMergeViewProps {
  originalContent: string;
  currentContent: string;
  language: string;
  tabId?: string | null;
  onChange?: (content: string) => void;
}

export function CodeMirrorMergeView(props: CodeMirrorMergeViewProps) {
  let containerRef!: HTMLDivElement;

  useCodeMirrorMerge({
    containerRef: () => containerRef,
    originalContent: () => props.originalContent,
    currentContent: () => props.currentContent,
    language: () => props.language,
    tabId: () => props.tabId,
    onChange: props.onChange,
  });

  const inverseZoom = () => 1 / settingsStore.zoomLevel();

  return (
    <div
      ref={containerRef}
      class="h-full w-full overflow-hidden"
      style={{
        display: "flex",
        "flex-direction": "column",
        transform: `scale(${inverseZoom()})`,
        "transform-origin": "top left",
        width: `${settingsStore.zoomLevel() * 100}%`,
        height: `${settingsStore.zoomLevel() * 100}%`,
      }}
    />
  );
}
