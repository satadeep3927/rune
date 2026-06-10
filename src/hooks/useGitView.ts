import { createSignal } from "solid-js";
import { useGit } from "@/hooks/useGit";

export function useGitView(fs: any) {
  const gitStore = useGit(fs);
  const [commitMessage, setCommitMessage] = createSignal("");
  const [isCommitting, setIsCommitting] = createSignal(false);

  const handleCommit = async () => {
    if (!commitMessage().trim()) return;
    setIsCommitting(true);
    try {
      await gitStore.commit(commitMessage());
      setCommitMessage("");
    } catch (e) {
      console.error("Commit failed:", e);
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
