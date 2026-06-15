import { createSignal, onCleanup, onMount } from "solid-js";
import { useGit } from "@/hooks/useGit";
import { useUI } from "@/contexts/UIContext";

export function useBranchPicker(fs: any) {
  const { gitState, listBranches, checkoutBranch, createBranch } = useGit(fs);
  const ui = useUI();
  const [isOpen, setIsOpen] = createSignal(false);
  const [branches, setBranches] = createSignal<string[]>([]);

  const toggleOpen = async (e: MouseEvent) => {
    e.stopPropagation();
    if (!isOpen()) {
      const b = await listBranches();
      if (b) setBranches(b);
    }
    setIsOpen(!isOpen());
  };

  const closeMenu = () => setIsOpen(false);

  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest("[data-branch-picker]")) {
      closeMenu();
    }
  };

  onMount(() => document.addEventListener("click", handleClickOutside));
  onCleanup(() => document.removeEventListener("click", handleClickOutside));

  const handleSelectBranch = async (b: string) => {
    closeMenu();
    if (b !== gitState()?.branch) {
      await checkoutBranch(b);
    }
  };

  const handleCreateBranch = async () => {
    closeMenu();
    const result = await ui.showPromptDialog(
      "Create Branch",
      [
        {
          id: "branchName",
          label: "Branch Name",
          placeholder: "e.g., feature/new-idea",
        },
      ],
      { okLabel: "Create" },
    );

    if (result && result.branchName && result.branchName.trim() !== "") {
      await createBranch(result.branchName.trim());
    }
  };

  return {
    gitState,
    isOpen,
    branches,
    toggleOpen,
    handleSelectBranch,
    handleCreateBranch,
  };
}
