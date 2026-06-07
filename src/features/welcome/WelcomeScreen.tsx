import { tabStore } from "@/stores/tabs";
import { useFileSystem } from "@/hooks/useFileSystem";
import { NewFileIcon } from "@/components/ui/icons/NewFileIcon";
import { FolderOpenIcon } from "@/components/ui/icons/FolderOpenIcon";
import { TerminalIcon } from "@/components/ui/icons/TerminalIcon";

interface WelcomeScreenProps {
  onOpenCommandPalette: () => void;
}

export function WelcomeScreen(props: WelcomeScreenProps) {
  const fs = useFileSystem();

  return (
    <div
      class="@container flex-1 flex flex-col items-center justify-center p-4 sm:p-8 @3xl:p-12 overflow-y-auto"
      style={{ background: "var(--color-bg)" }}
    >
      <div class="max-w-[760px] w-full flex flex-col gap-8 @3xl:gap-12 my-auto">
        {/* Header */}
        <div class="flex flex-col items-center text-center">
          <img
            src="/logo.svg"
            alt="Rune Logo"
            class="w-12 h-12 @3xl:w-16 @3xl:h-16 mb-4 select-none pointer-events-none rounded-2xl"
            style={{ "box-shadow": "0 0 20px var(--color-border)" }}
          />
          <h1 class="text-2xl @3xl:text-3xl font-light tracking-[0.3em] uppercase text-[var(--color-fg)]">
            Rune
          </h1>
          <p class="text-xs @3xl:text-sm font-light tracking-wide mt-2 text-[var(--color-fg-muted)]">
            A lightweight, lightning-fast code editor
          </p>
        </div>

        {/* Main Content Grid */}
        <div class="grid grid-cols-1 @3xl:grid-cols-2 gap-6 @3xl:gap-8 items-start">
          {/* Left Column - Actions */}
          <div class="flex flex-col gap-3">
            <h2 class="text-[10px] @3xl:text-xs uppercase tracking-[0.2em] font-semibold text-[var(--color-fg-muted)] mb-1">
              Start
            </h2>
            <button
              class="w-full text-left p-4 rounded-lg transition-all flex items-center gap-4 group cursor-pointer border border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-accent)] hover:bg-[var(--color-bg-tertiary)]"
              onClick={() => tabStore.openUntitledTab()}
            >
              <div class="p-2 rounded transition-colors bg-[var(--color-bg)] border border-[var(--color-border)]">
                <NewFileIcon class="w-[18px] h-[18px] text-[var(--color-fg-muted)] group-hover:text-[var(--color-accent)] transition-colors" />
              </div>
              <div class="min-w-0 flex-1">
                <span class="text-sm font-medium text-[var(--color-fg)] transition-colors block truncate">
                  New File
                </span>
                <span class="text-xs text-[var(--color-fg-muted)] mt-0.5 block truncate">
                  Create a new scratchpad file
                </span>
              </div>
              <kbd class="ml-auto text-[10px] px-2 py-1 rounded font-mono hidden @sm:block shrink-0 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-fg-muted)]">
                Ctrl+N
              </kbd>
            </button>

            <button
              class="w-full text-left p-4 rounded-lg transition-all flex items-center gap-4 group cursor-pointer border border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-accent)] hover:bg-[var(--color-bg-tertiary)]"
              onClick={() => fs.openFolder()}
            >
              <div class="p-2 rounded transition-colors bg-[var(--color-bg)] border border-[var(--color-border)]">
                <FolderOpenIcon class="w-[18px] h-[18px] text-[var(--color-fg-muted)] group-hover:text-[var(--color-accent)] transition-colors" />
              </div>
              <div class="min-w-0 flex-1">
                <span class="text-sm font-medium text-[var(--color-fg)] transition-colors block truncate">
                  Open Folder
                </span>
                <span class="text-xs text-[var(--color-fg-muted)] mt-0.5 block truncate">
                  Open an existing workspace
                </span>
              </div>
              <kbd class="ml-auto text-[10px] px-2 py-1 rounded font-mono hidden @sm:block shrink-0 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-fg-muted)]">
                Ctrl+K Ctrl+O
              </kbd>
            </button>

            <button
              class="w-full text-left p-4 rounded-lg transition-all flex items-center gap-4 group cursor-pointer border border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-accent)] hover:bg-[var(--color-bg-tertiary)]"
              onClick={props.onOpenCommandPalette}
            >
              <div class="p-2 rounded transition-colors bg-[var(--color-bg)] border border-[var(--color-border)]">
                <TerminalIcon class="w-[18px] h-[18px] text-[var(--color-fg-muted)] group-hover:text-[var(--color-accent)] transition-colors" />
              </div>
              <div class="min-w-0 flex-1">
                <span class="text-sm font-medium text-[var(--color-fg)] transition-colors block truncate">
                  Command Palette
                </span>
                <span class="text-xs text-[var(--color-fg-muted)] mt-0.5 block truncate">
                  Run commands and search tools
                </span>
              </div>
              <kbd class="ml-auto text-[10px] px-2 py-1 rounded font-mono hidden @sm:block shrink-0 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-fg-muted)]">
                Ctrl+Shift+P
              </kbd>
            </button>
          </div>

          {/* Right Column - Shortcuts */}
          <div class="flex flex-col gap-3">
            <h2 class="text-[10px] @3xl:text-xs uppercase tracking-[0.2em] font-semibold text-[var(--color-fg-muted)] mb-1">
              Keyboard Shortcuts
            </h2>
            <div class="rounded-lg p-5 flex flex-col gap-4 border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
              <div class="flex justify-between items-center text-xs pb-2 border-b border-[var(--color-border)]">
                <span class="truncate mr-2 min-w-0 flex-1 text-[var(--color-fg-muted)]">
                  New Window
                </span>
                <kbd class="px-2 py-0.5 rounded font-mono shrink-0 hidden @sm:block bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-fg)]">
                  Ctrl+Shift+N
                </kbd>
              </div>
              <div class="flex justify-between items-center text-xs pb-2 border-b border-[var(--color-border)]">
                <span class="truncate mr-2 min-w-0 flex-1 text-[var(--color-fg-muted)]">
                  Save Document
                </span>
                <kbd class="px-2 py-0.5 rounded font-mono shrink-0 hidden @sm:block bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-fg)]">
                  Ctrl+S
                </kbd>
              </div>
              <div class="flex justify-between items-center text-xs pb-2 border-b border-[var(--color-border)]">
                <span class="truncate mr-2 min-w-0 flex-1 text-[var(--color-fg-muted)]">
                  Find in Workspace
                </span>
                <kbd class="px-2 py-0.5 rounded font-mono shrink-0 hidden @sm:block bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-fg)]">
                  Ctrl+Shift+F
                </kbd>
              </div>
              <div class="flex justify-between items-center text-xs pb-2 border-b border-[var(--color-border)]">
                <span class="truncate mr-2 min-w-0 flex-1 text-[var(--color-fg-muted)]">
                  Toggle Sidebar
                </span>
                <kbd class="px-2 py-0.5 rounded font-mono shrink-0 hidden @sm:block bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-fg)]">
                  Ctrl+B
                </kbd>
              </div>
              <div class="flex justify-between items-center text-xs">
                <span class="truncate mr-2 min-w-0 flex-1 text-[var(--color-fg-muted)]">
                  Zoom In / Out
                </span>
                <kbd class="px-2 py-0.5 rounded font-mono shrink-0 hidden @sm:block bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-fg)]">
                  Ctrl + / -
                </kbd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
