import { createSignal, createResource, onMount, onCleanup } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { useFileSystem } from "@/hooks/useFileSystem";

export interface GitFileStatus {
  file: string;
  status: string;
}

export interface GitState {
  branch: string | null;
  status: GitFileStatus[];
}

export function useGit(fs: ReturnType<typeof useFileSystem>) {
  const [lastUpdate, setLastUpdate] = createSignal(Date.now());

  const fetchGitState = async (path: string | null, _timestamp: number) => {
    if (!path) return null;
    try {
      const state = await invoke<GitState | null>("get_git_state", { path });
      return state;
    } catch (err) {
      console.error("Failed to fetch git state:", err);
      return null;
    }
  };

  const [gitState] = createResource(
    () => [fs.rootPath(), lastUpdate()] as const,
    ([path, ts]) => fetchGitState(path, ts)
  );

  const refreshGit = () => setLastUpdate(Date.now());

  onMount(() => {
    const handleFsChange = () => refreshGit();
    window.addEventListener('fs-change', handleFsChange);
    onCleanup(() => window.removeEventListener('fs-change', handleFsChange));
  });

  const commit = async (message: string) => {
    const root = fs.rootPath();
    if (!root) return;
    try {
      await invoke("git_commit", { path: root, message });
      refreshGit();
    } catch (err) {
      console.error("Commit failed:", err);
      throw err;
    }
  };

  const stageFiles = async (files: string[]) => {
    const root = fs.rootPath();
    if (!root) return;
    try {
      await invoke("git_add", { path: root, files });
      refreshGit();
    } catch (err) {
      console.error("Stage failed:", err);
      throw err;
    }
  };

  const unstageFiles = async (files: string[]) => {
    const root = fs.rootPath();
    if (!root) return;
    try {
      await invoke("git_reset", { path: root, files });
      refreshGit();
    } catch (err) {
      console.error("Unstage failed:", err);
      throw err;
    }
  };

  const discardChanges = async (files: string[]) => {
    const root = fs.rootPath();
    if (!root) return;
    try {
      await invoke("git_discard", { path: root, files });
      refreshGit();
    } catch (err) {
      console.error("Discard failed:", err);
      throw err;
    }
  };

  const push = async () => {
    const root = fs.rootPath();
    if (!root) return;
    try {
      await invoke("git_push", { path: root });
      refreshGit();
    } catch (err) {
      console.error("Push failed:", err);
      throw err;
    }
  };

  const pull = async () => {
    const root = fs.rootPath();
    if (!root) return;
    try {
      await invoke("git_pull", { path: root });
      refreshGit();
      fs.refreshTree();
    } catch (err) {
      console.error("Pull failed:", err);
      throw err;
    }
  };

  const init = async () => {
    const root = fs.rootPath();
    if (!root) return;
    try {
      await invoke("git_init", { path: root });
      refreshGit();
    } catch (err) {
      console.error("Init failed:", err);
      throw err;
    }
  };

  const listBranches = async (): Promise<string[]> => {
    const root = fs.rootPath();
    if (!root) return [];
    try {
      return await invoke<string[]>("git_list_branches", { path: root });
    } catch (err) {
      console.error("List branches failed:", err);
      return [];
    }
  };

  const checkoutBranch = async (branch: string) => {
    const root = fs.rootPath();
    if (!root) return;
    try {
      await invoke("git_checkout", { path: root, branch });
      refreshGit();
    } catch (err) {
      console.error("Checkout failed:", err);
      throw err;
    }
  };

  const createBranch = async (branch: string) => {
    const root = fs.rootPath();
    if (!root) return;
    try {
      await invoke("git_create_branch", { path: root, branch });
      refreshGit();
    } catch (err) {
      console.error("Create branch failed:", err);
      throw err;
    }
  };

  const getFileDiff = async (file: string, refName: string = "HEAD"): Promise<string> => {
    const root = fs.rootPath();
    if (!root) return "";
    try {
      return await invoke<string>("git_show_file", { path: root, file, refName });
    } catch (err) {
      console.error(`Failed to get diff for ${file}:`, err);
      return "";
    }
  };

  return {
    gitState,
    refreshGit,
    commit,
    stageFiles,
    unstageFiles,
    push,
    pull,
    init,
    discardChanges,
    listBranches,
    checkoutBranch,
    createBranch,
    getFileDiff,
  };
}
