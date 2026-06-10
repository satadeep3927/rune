import { createSignal } from "solid-js";

export type SidebarTab = "files" | "git";

export function useSidebar() {
  const [activeTab, setActiveTab] = createSignal<SidebarTab>("files");

  const switchTab = (tab: SidebarTab) => {
    setActiveTab(tab);
  };

  return {
    activeTab,
    switchTab,
  };
}
