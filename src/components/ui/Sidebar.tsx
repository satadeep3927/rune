import { Show } from "solid-js";
import { ActivityBar } from "./ActivityBar";
import { useSidebar } from "@/hooks/useSidebar";

// Feature panes
import { FileTree } from "@/features/file-tree";
import { GitView } from "@/features/git/GitView";

export interface SidebarProps {
  width: number;
  
  // FileTree Props (passthrough)
  fs: any;
  handleFileTreeSelect: (entry: any) => void;
  handleFileTreeContextMenu: (entry: any, e: MouseEvent) => void;
  handleEmptyContextMenu: (e: MouseEvent) => void;
  leftActiveTab: any;
  selectedPaths: any;
  setSelectedPaths: any;
  editingItem: any;
  handleStartEdit: any;
  handleSubmitEdit: any;
  handleCancelEdit: any;
  fileClipboard: any;
  showConfirmDialog: (message: string, options?: any) => Promise<boolean>;

  // Terminal Props (passthrough)
  terminalHeight: number;
}

export function Sidebar(props: SidebarProps) {
  const { activeTab, switchTab } = useSidebar();

  return (
    <aside
      class="flex flex-col h-full shrink-0"
      style={{
        width: `${props.width}px`,
        background: "var(--color-sidebar-bg)",
        "border-right": "1px solid var(--color-border)",
      }}
    >
      <ActivityBar activeTab={activeTab()} onSwitchTab={switchTab} width={props.width} />

      <div class="flex-1 overflow-hidden relative">
        <Show when={activeTab() === "files"}>
          <FileTree
            tree={props.fs.tree()}
            rootPath={props.fs.rootPath()}
            loading={props.fs.loading()}
            width={props.width}
            onFileClick={props.handleFileTreeSelect}
            onToggleDir={props.fs.toggleDirectory}
            onOpenFolder={props.fs.openFolder}
            onRefresh={props.fs.refreshTree}
            onContextMenu={props.handleFileTreeContextMenu}
            onEmptyContextMenu={props.handleEmptyContextMenu}
            activeFilePath={props.leftActiveTab?.filePath}
            selectedPaths={props.selectedPaths}
            onSelectPaths={props.setSelectedPaths}
            editingItem={props.editingItem}
            onStartEdit={props.handleStartEdit}
            onSubmitEdit={props.handleSubmitEdit}
            onCancelEdit={props.handleCancelEdit}
            fileClipboard={props.fileClipboard}
            hideHeader={true}
          />
        </Show>

        <Show when={activeTab() === "git"}>
          <GitView fs={props.fs} width={props.width} onOpenFile={(path, options) => props.handleFileTreeSelect({ path, isDirectory: false, name: path.split('/').pop(), ...options })} />
        </Show>

      </div>
    </aside>
  );
}
