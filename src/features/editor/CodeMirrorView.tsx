import { createSignal, Show } from "solid-js";
import { useCodeMirror } from "@/hooks/useCodeMirror";
import { ContextMenu, type ContextMenuItem } from "@/components/ui/ContextMenu";

interface CodeMirrorViewProps {
  content: string;
  language: string;
  onChange?: (content: string) => void;
  onScrollerRef?: (el: HTMLElement | null) => void;
  tabId?: string | null;
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
    onChange: props.onChange,
    onScrollerRef: props.onScrollerRef,
    setCtxMenu,
  });

  return (
    <>
      <div
        ref={containerRef}
        class="h-full w-full overflow-hidden"
        onContextMenu={handleContextMenu}
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
