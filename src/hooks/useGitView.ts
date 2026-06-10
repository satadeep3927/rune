import { createSignal } from "solid-js";
import { useGit } from "@/hooks/useGit";

import { useUI } from "@/contexts/UIContext";

export function useGitView(fs: any) {
  const gitStore = useGit(fs);
  const [commitMessage, setCommitMessage] = createSignal("");
  const [isCommitting, setIsCommitting] = createSignal(false);
  const ui = useUI();

  const handleCommit = async () => {
    if (!commitMessage().trim()) return false;
    setIsCommitting(true);
    try {
      await gitStore.commit(commitMessage());
      setCommitMessage("");
      return true;
    } catch (e: any) {
      console.error("Commit failed:", e);
      ui.showConfirmDialog("Commit Failed", {
        detail: typeof e === "string" && e.trim() ? e : "No files staged or working tree clean.",
        okLabel: "Close",
        hideCancel: true,
      });
      return false;
    } finally {
      setIsCommitting(false);
    }
  };

  const [isPushing, setIsPushing] = createSignal(false);
  const [isPulling, setIsPulling] = createSignal(false);

  const isRepo = () => gitStore.gitState() !== null;

  const handlePush = async () => {
    setIsPushing(true);
    try {
      await gitStore.push();
      return true;
    } catch (e: any) {
      ui.showConfirmDialog("Push Failed", {
        detail: typeof e === "string" && e.trim() ? e : "An error occurred during push.",
        okLabel: "Close",
        hideCancel: true,
      });
      return false;
    } finally {
      setIsPushing(false);
    }
  };

  const handlePull = async () => {
    setIsPulling(true);
    try {
      await gitStore.pull();
      return true;
    } catch (e: any) {
      ui.showConfirmDialog("Pull Failed", {
        detail: typeof e === "string" && e.trim() ? e : "An error occurred during pull.",
        okLabel: "Close",
        hideCancel: true,
      });
      return false;
    } finally {
      setIsPulling(false);
    }
  };

  return {
    ...gitStore,
    commitMessage,
    setCommitMessage,
    isCommitting,
    isPushing,
    isPulling,
    handleCommit,
    handlePush,
    handlePull,
    isRepo
  };
}
