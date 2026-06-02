import { createSignal, onMount } from "solid-js";
import { getCurrentWindow } from "@tauri-apps/api/window";

export function useWindowControls() {
  const appWindow = getCurrentWindow();
  const [isMaximized, setIsMaximized] = createSignal(false);

  onMount(async () => {
    setIsMaximized(await appWindow.isMaximized());
    appWindow.onResized(async () => {
      setIsMaximized(await appWindow.isMaximized());
    });
  });

  return { isMaximized };
}
