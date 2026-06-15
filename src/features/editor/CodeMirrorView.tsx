import { createSignal, Show } from "solid-js";
import { useCodeMirror } from "@/hooks/useCodeMirror";
import { ContextMenu, type ContextMenuItem } from "@/components/ui/ContextMenu";
import { settingsStore } from "@/stores/settings";

interface CodeMirrorViewProps {
  content: string;
  language: string;
  onChange?: (content: string) => void;
  onScrollerRef?: (el: HTMLElement | null) => void;
  tabId?: string | null;
  isActive?: boolean;
}

export function CodeMirrorView(props: CodeMirrorViewProps) {
  let containerRef!: HTMLDivElement;
  const [ctxMenu, setCtxMenu] = createSignal<{
    x: number;
    y: number;
    items: ContextMenuItem[];
  } | null>(null);

  const { handleContextMenu } = useCodeMirror({
    containerRef: () => containerRef,
    content: () => props.content,
    language: () => props.language,
    tabId: () => props.tabId,
    isActive: () => props.isActive,
    onChange: props.onChange,
    onScrollerRef: props.onScrollerRef,
    setCtxMenu,
  });

  const inverseZoom = () => 1 / settingsStore.zoomLevel();

  return (
    <>
      <div
        ref={containerRef}
        class="h-full w-full overflow-hidden"
        onContextMenu={handleContextMenu}
        style={{
          transform: `scale(${inverseZoom()})`,
          "transform-origin": "top left",
          width: `${settingsStore.zoomLevel() * 100}%`,
          height: `${settingsStore.zoomLevel() * 100}%`,
        }}
      />
      <Show when={ctxMenu()}>
        {(cm) => (
          <ContextMenu
            x={cm().x}
            y={cm().y}
            items={cm().items}
            onClose={() => setCtxMenu(null)}
          />
        )}
      </Show>
    </>
  );
}
