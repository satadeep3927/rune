import { TabBar, Editor } from "@/features/editor";
import { WelcomeScreen } from "@/features/welcome/WelcomeScreen";
import { tabStore } from "@/stores/tabs";
import { useEditorPane } from "@/hooks/useEditorPane";
import type { PaneSide } from "@/types";
import { XIcon } from "@/components/ui/icons/XIcon";
import { Show, For } from "solid-js";
import { FindReplace } from "@/components/editor/FindReplace";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";

interface EditorPaneProps {
  pane: PaneSide;
  onTabContextMenu: (id: string, pane: PaneSide, e: MouseEvent) => void;
  onCloseSplit?: () => void;
}

export function EditorPane(props: EditorPaneProps) {
  const {
    currentTabs,
    activeTabId,
    activeTab,
    widthStyle,
    handleTabClick,
    handleTabClose,
  } = useEditorPane(props.pane);

  return (
    <div
      class={`flex flex-col overflow-hidden pane-${props.pane}`}
      style={{ width: widthStyle() }}
      onMouseDown={() => tabStore.setFocusedPane(props.pane)}
    >
      <FindReplace />
      <TabBar
        tabs={currentTabs()}
        activeTabId={activeTabId()}
        onTabClick={handleTabClick}
        onTabClose={handleTabClose}
        onTabContextMenu={(id, e) => props.onTabContextMenu(id, props.pane, e)}
        trailing={
          <Show when={props.onCloseSplit}>
            <div class="flex items-center h-full pr-2">
              <button
                class="flex items-center justify-center p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/5 text-[var(--color-fg-muted)] hover:text-red-400 transition-colors cursor-pointer"
                onClick={props.onCloseSplit}
                title="Close split"
              >
                <XIcon class="w-2.5 h-2.5" stroke-width="1.2" />
              </button>
            </div>
          </Show>
        }
      />
      <Show when={activeTab()?.hasConflict}>
        <Alert
          variant="warning"
          actions={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const tabId = activeTab()?.id;
                  if (tabId) tabStore.resolveTabConflict(tabId, "overwrite");
                }}
              >
                Overwrite Disk
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const tabId = activeTab()?.id;
                  if (tabId) tabStore.resolveTabConflict(tabId, "discard");
                }}
              >
                Discard Editor
              </Button>
            </>
          }
        >
          This file has been modified on disk by another program.
        </Alert>
      </Show>
      <div class="flex-1 overflow-hidden relative">
        <Show when={currentTabs().length === 0}>
          <div class="absolute inset-0">
            <WelcomeScreen />
          </div>
        </Show>
        <For each={currentTabs().map((t) => t.id)}>
          {(id) => {
            const tab = () => currentTabs().find((t) => t.id === id);
            return (
              <Show when={tab()}>
                <div
                  class="absolute inset-0"
                  style={{
                    display: activeTabId() === id ? "block" : "none",
                    "z-index": activeTabId() === id ? 10 : 1,
                  }}
                >
                  <Editor
                    tabId={id}
                    isActive={activeTabId() === id}
                  />
                </div>
              </Show>
            );
          }}
        </For>
      </div>
    </div>
  );
}
