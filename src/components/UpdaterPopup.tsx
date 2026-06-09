import { Show } from "solid-js";
import { Sparkles, ExternalLink } from "lucide-solid";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { useUpdater } from "@/hooks/useUpdater";

export function UpdaterPopup() {
  const {
    updateInfo,
    isDownloading,
    downloadProgress,
    isVisible,
    handleInstall,
    closePopup,
    openReleaseNotes,
  } = useUpdater();

  return (
    <Toast
      open={isVisible()}
      onOpenChange={(open) => !open && closePopup()}
      icon={<Sparkles size={16} />}
      title="Rune Update"
      description={
        <div class="flex flex-col gap-2">
          <p class="text-[13px] font-medium">Version {updateInfo()?.version} is out!</p>
          <div class="text-xs text-[var(--color-fg-muted)] max-h-32 overflow-y-auto whitespace-pre-wrap pr-2 scrollbar-thin">
            {updateInfo()?.body}
          </div>
          <Button 
            variant="link"
            size="sm"
            class="self-start px-0 text-[11px] h-auto flex items-center gap-1.5 text-[var(--color-fg-muted)] hover:text-[var(--color-accent)]"
            onClick={openReleaseNotes}
          >
            <ExternalLink size={12} />
            See full release notes
          </Button>
        </div>
      }
      action={
        <Show 
          when={!isDownloading()} 
          fallback={
            <div class="flex-1 flex items-center justify-between bg-[var(--color-bg)] rounded-md px-3 py-2 border border-[var(--color-border)] w-full">
              <span class="text-xs text-[var(--color-fg-muted)]">Downloading...</span>
              <span class="text-xs font-mono text-[var(--color-accent)]">{downloadProgress()}%</span>
            </div>
          }
        >
          <div class="flex justify-end gap-2 w-full">
            <Button 
              variant="ghost"
              onClick={closePopup}
            >
              Later
            </Button>
            <Button 
              variant="primary"
              onClick={handleInstall}
            >
              Install Update
            </Button>
          </div>
        </Show>
      }
    />
  );
}
