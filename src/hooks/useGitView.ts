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

  const handlePush = async () => {
    try {
      await gitStore.push();
    } catch (e: any) {
      ui.showConfirmDialog("Push Failed", {
        detail: typeof e === "string" && e.trim() ? e : "An error occurred during push.",
        okLabel: "Close",
        hideCancel: true,
      });
    }
  };

  const handlePull = async () => {
    try {
      await gitStore.pull();
    } catch (e: any) {
      ui.showConfirmDialog("Pull Failed", {
        detail: typeof e === "string" && e.trim() ? e : "An error occurred during pull.",
        okLabel: "Close",
        hideCancel: true,
      });
    }
  };

  return {
    ...gitStore,
    commitMessage,
    setCommitMessage,
    isCommitting,
    handleCommit,
    handlePush,
    handlePull,
    isRepo
  };
}
