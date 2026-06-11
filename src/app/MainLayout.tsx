import { Show } from "solid-js";
import { Titlebar } from "@/features/titlebar";
import { Sidebar } from "@/components/ui/Sidebar";
import { EditorPane } from "./EditorPane";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { CommandPalette } from "@/components/CommandPalette";
import { WelcomeScreen } from "@/features/welcome/WelcomeScreen";
import { QuickPick } from "@/components/QuickPick";
import { PromptDialog } from "@/components/ui/PromptDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { WorkspaceSearch } from "@/components/WorkspaceSearch";
import { TerminalPanel } from "@/components/terminal/TerminalPanel";
import { Toast } from "@/components/ui/Toast";
import { CheckCircle2, AlertCircle, Info } from "lucide-solid";
import { Portal } from "solid-js/web";

import { useMainLayout } from "@/hooks/useMainLayout";
import { settingsStore } from "@/stores/settings";
import { tabStore } from "@/stores/tabs";
import { useActiveFileWatcher } from "@/hooks/useActiveFileWatcher";

import { UIContext } from "@/contexts/UIContext";

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
    promptState,
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
    toastState,
    showConfirmDialog,
    showQuickPick,
    showPromptDialog,
    showToast,
  } = useMainLayout();

  return (
    <UIContext.Provider value={{ showConfirmDialog, showQuickPick, showPromptDialog, showToast }}>
      <div
        class="h-full w-full flex flex-col overflow-hidden"
        style={{ background: "var(--color-bg)", color: "var(--color-fg)" }}
        onContextMenu={(e) => {
          e.preventDefault();
        }}
      >
        <Titlebar menus={menus()} title={windowTitle()} fs={fs} />
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
              <Sidebar
                width={settingsStore.sidebarWidth()}
                fs={fs}
                handleFileTreeSelect={handleFileTreeSelect}
                handleFileTreeContextMenu={handleFileTreeContextMenu}
                handleEmptyContextMenu={handleEmptyContextMenu}
                leftActiveTab={leftActiveTab()}
                selectedPaths={selectedPaths()}
                setSelectedPaths={setSelectedPaths}
                editingItem={editingItem()}
                handleStartEdit={handleStartEdit}
                handleSubmitEdit={handleSubmitEdit}
                handleCancelEdit={handleCancelEdit}
                fileClipboard={fileClipboard}
                terminalHeight={terminalHeight()}
                showConfirmDialog={showConfirmDialog}
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
      <Show when={promptState()}>
        {(p) => (
          <PromptDialog
            title={p().title}
            message={p().message}
            fields={p().fields}
            okLabel={p().okLabel}
            cancelLabel={p().cancelLabel}
            onConfirm={p().onConfirm}
            onCancel={p().onCancel}
          />
        )}
      </Show>
      <Portal>
        <Toast 
          open={toastState() !== null} 
          onOpenChange={(open) => { if (!open && toastState()) showToast(toastState()!.title, toastState()!.description, { duration: 0 }); }}
          title={toastState()?.title}
          description={toastState()?.description}
          icon={toastState()?.variant === "error" ? <AlertCircle size={18} /> : toastState()?.variant === "info" ? <Info size={18} /> : <CheckCircle2 size={18} />}
        />
      </Portal>
    </div>
    </UIContext.Provider>
  );
}
