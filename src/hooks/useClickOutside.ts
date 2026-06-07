import { onCleanup } from "solid-js";

export function useClickOutside(
  ref: () => HTMLElement | undefined,
  onClickOutside: () => void,
) {
  const handleClick = (e: MouseEvent) => {
    const el = ref();
    if (el && !el.contains(e.target as Node)) {
      onClickOutside();
    }
  };

  window.addEventListener("click", handleClick);
  onCleanup(() => window.removeEventListener("click", handleClick));
}
