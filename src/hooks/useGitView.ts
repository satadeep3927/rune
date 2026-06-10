import { createSignal } from "solid-js";
import { useGit } from "@/hooks/useGit";

import { useUI } from "@/contexts/UIContext";

export function useGitView(fs: any) {
  const gitStore = useGit(fs);
  const [commitMessage, setCommitMessage] = createSignal("");
  const [isCommitting, setIsCommitting] = createSignal(false);
  const ui = useUI();

  const handleCommit = async () => {
    if (!commitMessage().trim()) return;
    setIsCommitting(true);
    try {
      await gitStore.commit(commitMessage());
      setCommitMessage("");
    } catch (e: any) {
      console.error("Commit failed:", e);
      ui.showConfirmDialog("Commit Failed", {
        detail: typeof e === "string" && e.trim() ? e : "No files staged or working tree clean.",
        okLabel: "Close",
        hideCancel: true,
      });
    } finally {
      setIsCommitting(false);
    }
  };

  const isRepo = () => gitStore.gitState() !== null;

  return {
    ...gitStore,
    commitMessage,
    setCommitMessage,
    isCommitting,
    handleCommit,
    isRepo
  };
}
