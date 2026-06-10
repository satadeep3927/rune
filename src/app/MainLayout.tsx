import { Show } from "solid-js";
import { Titlebar } from "@/features/titlebar";
import { FileTree } from "@/features/file-tree";
import { EditorPane } from "./EditorPane";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { CommandPalette } from "@/components/CommandPalette";
import { WelcomeScreen } from "@/features/welcome/WelcomeScreen";
import { QuickPick } from "@/components/QuickPick";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { WorkspaceSearch } from "@/components/WorkspaceSearch";
import { TerminalPanel } from "@/components/terminal/TerminalPanel";

import { useMainLayout } from "@/hooks/useMainLayout";
import { settingsStore } from "@/stores/settings";
import { tabStore } from "@/stores/tabs";
import { Button } from "@/components/ui/Button";
import { XIcon } from "@/components/ui/icons/XIcon";
import { useActiveFileWatcher } from "@/hooks/useActiveFileWatcher";

export function MainLayout() {
  useActiveFileWatcher();

  const {
    fs,
    ctxMenu,
    setCtxMenu,
    showCommandPalette,
    setShowCommandPalette,
    palettePrefix,
    setPalettePrefix,
    showWorkspaceSearch,
    setShowWorkspaceSearch,
    showTerminal,
    setShowTerminal,
    terminalHeight,
    editingItem,
    confirmState,
    quickPickState,
    selectedPaths,
    setSelectedPaths,
    handleEditorChange,
    handleFileTreeSelect,
    handleFileTreeContextMenu,
    handleEmptyContextMenu,
    handleSubmitEdit,
    handleStartEdit,
    handleCancelEdit,
    handleTabContextMenu,
    menus,
    commands,
    windowTitle,
    leftActiveTab,
    handleWelcomeOpenPalette,
    handleSidebarResize,
    handleSplitResize,
    handleCloseSplit,
    handleTerminalResize,
    handleWorkspaceSearchSelect,
    fileClipboard,
  } = useMainLayout();

  return (
    <div
      class="h-full w-full flex flex-col overflow-hidden"
      style={{ background: "var(--color-bg)", color: "var(--color-fg)" }}
      onContextMenu={(e) => {
        e.preventDefault();
      }}
    >
      <Titlebar menus={menus()} title={windowTitle()} />
      <Show
        when={
          fs.rootPath() ||
          tabStore.leftTabs().length > 0 ||
          tabStore.rightTabs().length > 0
        }
        fallback={
          <WelcomeScreen onOpenCommandPalette={handleWelcomeOpenPalette} />
        }
      >
        <div class="flex flex-1 overflow-hidden">
          {settingsStore.sidebarVisible() && (
            <>
              <FileTree
                tree={fs.tree()}
                rootPath={fs.rootPath()}
                loading={fs.loading()}
                width={settingsStore.sidebarWidth()}
                onFileClick={handleFileTreeSelect}
                onToggleDir={fs.toggleDirectory}
                onOpenFolder={fs.openFolder}
                onRefresh={fs.refreshTree}
                onContextMenu={handleFileTreeContextMenu}
                onEmptyContextMenu={handleEmptyContextMenu}
                activeFilePath={leftActiveTab()?.filePath}
                selectedPaths={selectedPaths()}
                onSelectPaths={setSelectedPaths}
                editingItem={editingItem()}
                onStartEdit={handleStartEdit}
                onSubmitEdit={handleSubmitEdit}
                onCancelEdit={handleCancelEdit}
                fileClipboard={fileClipboard}
              />
              <div
                class="w-[3px] shrink-0 cursor-col-resize hover:bg-[var(--color-accent)] transition-colors"
                style={{ background: "var(--color-border)" }}
                onMouseDown={handleSidebarResize}
              />
            </>
          )}
          <div class="flex-1 flex flex-col overflow-hidden">
            <div class="flex-1 flex overflow-hidden">
              {/* Left Pane */}
              <EditorPane
                pane="left"
                fs={fs}
                onTabContextMenu={handleTabContextMenu}
                handleEditorChange={handleEditorChange}
                setPalettePrefix={setPalettePrefix}
                setShowCommandPalette={setShowCommandPalette}
                setShowWorkspaceSearch={setShowWorkspaceSearch}
                onCloseSplit={
                  settingsStore.splitActive() ? handleCloseSplit : undefined
                }
              />

              {/* Split Divider */}
              <Show when={settingsStore.splitActive()}>
                <div
                  class="w-[3px] shrink-0 cursor-col-resize hover:bg-[var(--color-accent)] transition-colors relative group z-20"
                  style={{ background: "var(--color-border)" }}
                  onMouseDown={handleSplitResize}
                />
              </Show>

              {/* Right Pane */}
              <Show when={settingsStore.splitActive()}>
                <EditorPane
                  pane="right"
                  fs={fs}
                  onTabContextMenu={handleTabContextMenu}
                  handleEditorChange={handleEditorChange}
                  setPalettePrefix={setPalettePrefix}
                  setShowCommandPalette={setShowCommandPalette}
                  setShowWorkspaceSearch={setShowWorkspaceSearch}
                />
              </Show>
            </div>
            <Show when={showTerminal()}>
              <div
                class="w-full h-[3px] shrink-0 cursor-row-resize hover:bg-[var(--color-accent)] transition-colors relative z-10"
                style={{ background: "var(--color-border)" }}
                onMouseDown={handleTerminalResize}
              />
              <div
                style={{ height: `${terminalHeight()}px` }}
                class="flex flex-col shrink-0 overflow-hidden"
              >
                <TerminalPanel
                  onClose={() => setShowTerminal(false)}
                  rootPath={fs.rootPath()}
                />
              </div>
            </Show>
          </div>
        </div>
      </Show>
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
      <Show when={showCommandPalette()}>
        <CommandPalette
          commands={commands()}
          onClose={() => setShowCommandPalette(false)}
          initialPrefix={palettePrefix()}
          rootPath={fs.rootPath()}
        />
      </Show>
      <Show when={showWorkspaceSearch()}>
        <WorkspaceSearch
          rootPath={fs.rootPath()}
          onClose={() => setShowWorkspaceSearch(false)}
          onResultClick={handleWorkspaceSearchSelect}
        />
      </Show>
      <Show when={confirmState()}>
        {(c) => (
          <ConfirmDialog
            message={c().message}
            detail={c().detail}
            okLabel={c().okLabel}
            cancelLabel={c().cancelLabel}
            variant={c().variant}
            hideCancel={c().hideCancel}
            onConfirm={c().onConfirm}
            onCancel={c().onCancel}
          />
        )}
      </Show>
      <Show when={quickPickState()}>
        {(qp) => (
          <QuickPick
            items={qp().items}
            placeholder={qp().placeholder}
            onSelect={qp().onSelect}
          />
        )}
      </Show>
    </div>
  );
}
