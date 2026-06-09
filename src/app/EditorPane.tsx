import { TabBar, Editor } from "@/features/editor";
import { tabStore } from "@/stores/tabs";
import { useEditorPane } from "@/hooks/useEditorPane";
import type { PaneSide } from "@/types";
import { XIcon } from "@/components/ui/icons/XIcon";
import { Show } from "solid-js";
import { FindReplace } from "@/components/editor/FindReplace";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";

interface EditorPaneProps {
  pane: PaneSide;
  fs: any;
  onTabContextMenu: (id: string, pane: PaneSide, e: MouseEvent) => void;
  handleEditorChange: (content: string, tabId: string) => void;
  setPalettePrefix: (p: string) => void;
  setShowCommandPalette: (s: boolean) => void;
  setShowWorkspaceSearch: (s: boolean) => void;
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
      <Editor
        content={activeTab()?.content ?? ""}
        language={activeTab()?.language ?? "text"}
        isDirty={activeTab()?.isDirty ?? false}
        hasOpenFile={!!activeTab()}
        onChange={(content) => {
          const tab = activeTab();
          if (tab) props.handleEditorChange(content, tab.id);
        }}
        tabId={activeTab()?.id ?? null}
        fileType={activeTab()?.fileType ?? "text"}
        dataUrl={activeTab()?.dataUrl}
        fileName={activeTab()?.fileName}
        onCreateFile={() => tabStore.openUntitledTab()}
        onOpenFolder={() => props.fs.openFolder()}
        onOpenCommandPalette={() => {
          props.setPalettePrefix(">");
          props.setShowCommandPalette(true);
        }}
        onSearchWorkspace={() => props.setShowWorkspaceSearch(true)}
      />
    </div>
  );
}
