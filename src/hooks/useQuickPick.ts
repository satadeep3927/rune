import { createSignal } from "solid-js";
import type { QuickPickItem } from "@/types";

export function useQuickPick(
  items: QuickPickItem[],
  onSelect: (id: string) => void,
  onClose: () => void,
) {
  const [filter, setFilter] = createSignal("");
  const [selectedIndex, setSelectedIndex] = createSignal(0);

  const filteredItems = () => {
    const q = filter().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (item.detail && item.detail.toLowerCase().includes(q)),
    );
  };

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        Math.min(prev + 1, filteredItems().length - 1),
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filteredItems()[selectedIndex()];
      if (item) {
        onSelect(item.id);
        onClose();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }

  function selectItem(index: number) {
    const item = filteredItems()[index];
    if (item) {
      onSelect(item.id);
      onClose();
    }
  }

  return {
    filter,
    setFilter,
    selectedIndex,
    setSelectedIndex,
    filteredItems,
    handleKeydown,
    selectItem,
  };
}
