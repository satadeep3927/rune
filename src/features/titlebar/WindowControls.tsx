import { getCurrentWindow } from "@tauri-apps/api/window";

export function WindowControls() {
  const appWindow = getCurrentWindow();

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

  return (
    <div class="flex h-full" style={{ color: "var(--color-fg-muted)" }}>
      <button
        onClick={handleMinimize}
        class="w-[46px] h-full flex items-center justify-center hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-fg)] transition-colors"
      >
        <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
          <rect width="10" height="1" />
        </svg>
      </button>
      <button
        onClick={handleMaximize}
        class="w-[46px] h-full flex items-center justify-center hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-fg)] transition-colors"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1">
          <rect x="0.5" y="0.5" width="9" height="9" />
        </svg>
      </button>
      <button
        onClick={handleClose}
        class="w-[46px] h-full flex items-center justify-center hover:bg-[var(--color-error)] hover:text-white transition-colors"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.2">
          <line x1="0" y1="0" x2="10" y2="10" />
          <line x1="10" y1="0" x2="0" y2="10" />
        </svg>
      </button>
    </div>
  );
}
