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

  async function handleMinimize() {
    await appWindow.minimize();
  }

  async function handleMaximize() {
    const maximized = await appWindow.isMaximized();
    if (maximized) {
      await appWindow.unmaximize();
    } else {
      await appWindow.maximize();
    }
  }

  async function handleClose() {
    await appWindow.close();
  }

  return {
    isMaximized,
    handleMinimize,
    handleMaximize,
    handleClose,
  };
}
