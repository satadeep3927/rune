import { onCleanup } from "solid-js";

interface UseContextMenuOptions {
  onClose: () => void;
}

export function useContextMenu(options: UseContextMenuOptions) {
  function handleClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest("[data-context-menu]")) {
      options.onClose();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") options.onClose();
  }

  function handleScroll() {
    options.onClose();
  }

  document.addEventListener("click", handleClickOutside);
  document.addEventListener("keydown", handleKeydown);
  document.addEventListener("scroll", handleScroll, true);

  onCleanup(() => {
    document.removeEventListener("click", handleClickOutside);
    document.removeEventListener("keydown", handleKeydown);
    document.removeEventListener("scroll", handleScroll, true);
  });
}
