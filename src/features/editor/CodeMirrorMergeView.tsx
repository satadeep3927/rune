import { useCodeMirrorMerge } from "./useCodeMirrorMerge";

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

  return (
    <div
      ref={containerRef}
      class="h-full w-full overflow-hidden"
      style={{
        display: "flex",
        "flex-direction": "column",
      }}
    />
  );
}
