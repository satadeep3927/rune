import { createSignal, onMount, onCleanup } from "solid-js";
import { Folder, GitBranch } from "lucide-solid";
import type { SidebarTab } from "@/hooks/useSidebar";
import { pluginRegistry } from "@/plugins/registry";

export function useActivityBar(width: () => number) {
  const [showDropdown, setShowDropdown] = createSignal(false);
  let containerRef!: HTMLDivElement;

  const coreTabs = [
    { id: "files" as SidebarTab, label: "Files", iconLucide: Folder, isTab: true, action: null, iconSvg: null },
    { id: "git" as SidebarTab, label: "Git", iconLucide: GitBranch, isTab: true, action: null, iconSvg: null },
  ];

  const pluginItems = () => pluginRegistry.getExplorerToolbarItems().map(item => ({
    id: item.id,
    label: item.label || item.title,
    iconSvg: item.icon,
    action: item.action,
    isTab: false,
    iconLucide: null,
  }));

  const allItems = () => [...coreTabs, ...pluginItems()];

  const visibleCount = () => {
    const total = allItems().length;
    const maxVisible = Math.max(1, Math.floor((width() - 24) / 55));
    if (maxVisible >= total) return total;
    return maxVisible;
  };

  const visibleItems = () => allItems().slice(0, visibleCount());
  const hiddenItems = () => allItems().slice(visibleCount());

  onMount(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (showDropdown() && containerRef && !containerRef.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    onCleanup(() => document.removeEventListener("mousedown", onClickOutside));
  });

  return {
    showDropdown,
    setShowDropdown,
    visibleItems,
    hiddenItems,
    setContainerRef: (el: HTMLDivElement) => { containerRef = el; }
  };
}
