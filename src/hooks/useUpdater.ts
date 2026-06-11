import { createSignal, onMount } from "solid-js";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { openUrl } from "@tauri-apps/plugin-opener";

export function useUpdater() {
  const [updateInfo, setUpdateInfo] = createSignal<{
    version: string;
    body: string;
  } | null>(null);
  const [isDownloading, setIsDownloading] = createSignal(false);
  const [downloadProgress, setDownloadProgress] = createSignal(0);
  const [isVisible, setIsVisible] = createSignal(false);
  const [updateAvailable, setUpdateAvailable] = createSignal<any>(null);

  onMount(() => {
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
          case "Started":
            contentLength = event.data.contentLength || 0;
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            if (contentLength > 0) {
              setDownloadProgress(
                Math.round((downloaded / contentLength) * 100),
              );
            }
            break;
          case "Finished":
            break;
        }
      });
      await relaunch();
    } catch (e) {
      console.error("Failed to install update", e);
      setIsDownloading(false);
    }
  };

  const closePopup = () => setIsVisible(false);

  const openReleaseNotes = () =>
    openUrl("https://github.com/satadeep3927/rune/releases/latest");

  return {
    updateInfo,
    isDownloading,
    downloadProgress,
    isVisible,
    handleInstall,
    closePopup,
    openReleaseNotes,
  };
}
