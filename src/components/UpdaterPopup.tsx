import { createSignal, onMount, Show } from "solid-js";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { X } from "lucide-solid";

export function UpdaterPopup() {
  const [updateInfo, setUpdateInfo] = createSignal<{ version: string; body: string } | null>(null);
  const [isDownloading, setIsDownloading] = createSignal(false);
  const [downloadProgress, setDownloadProgress] = createSignal(0);
  const [isVisible, setIsVisible] = createSignal(false);
  const [updateAvailable, setUpdateAvailable] = createSignal<any>(null);

  onMount(async () => {
    try {
      // Small delay before checking so we don't block startup
      setTimeout(async () => {
        try {
          const update = await check();
          if (update?.available) {
            setUpdateAvailable(update);
            setUpdateInfo({
              version: update.version,
              body: update.body || "A new version of Rune is available.",
            });
            setIsVisible(true);
          }
        } catch (e) {
          // Fail silently: GitHub release isn't published yet
        }
      }, 5000);
    } catch (e) {
      console.error("Failed to check for updates", e);
    }
  });

  const handleInstall = async () => {
    const update = updateAvailable();
    if (!update) return;

    setIsDownloading(true);
    try {
      let downloaded = 0;
      let contentLength = 0;
      await update.downloadAndInstall((event: any) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength || 0;
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            if (contentLength > 0) {
              setDownloadProgress(Math.round((downloaded / contentLength) * 100));
            }
            break;
          case 'Finished':
            break;
        }
      });
      await relaunch();
    } catch (e) {
      console.error("Failed to install update", e);
      setIsDownloading(false);
    }
  };

  return (
    <Show when={isVisible()}>
      <div class="fixed bottom-4 right-4 w-96 bg-[#0F1318] border border-gray-700/50 shadow-2xl rounded-lg p-4 z-50 animate-in slide-in-from-bottom-5 text-gray-200 flex flex-col gap-3">
        <div class="flex justify-between items-center border-b border-gray-700/50 pb-2">
          <h3 class="text-sm font-semibold text-blue-400">Update Available</h3>
          <button 
            class="text-gray-400 hover:text-white transition-colors"
            onClick={() => setIsVisible(false)}
          >
            <X size={16} />
          </button>
        </div>
        
        <div>
          <p class="text-sm font-medium">Version {updateInfo()?.version} is out!</p>
          <div class="mt-2 text-xs text-gray-400 max-h-32 overflow-y-auto whitespace-pre-wrap pr-2 scrollbar-thin">
            {updateInfo()?.body}
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-2">
          <Show 
            when={!isDownloading()} 
            fallback={
              <div class="flex-1 flex items-center justify-between">
                <span class="text-xs text-gray-400">Downloading...</span>
                <span class="text-xs font-mono">{downloadProgress()}%</span>
              </div>
            }
          >
            <button 
              onClick={() => setIsVisible(false)}
              class="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 rounded text-gray-300 transition-colors"
            >
              Later
            </button>
            <button 
              onClick={handleInstall}
              class="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 rounded text-white font-medium transition-colors shadow"
            >
              Install Update
            </button>
          </Show>
        </div>
      </div>
    </Show>
  );
}
