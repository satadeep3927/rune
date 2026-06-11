import { createSignal, createResource } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { useFileSystem } from "@/hooks/useFileSystem";
import { useUI } from "@/contexts/UIContext";

export interface GitRemote {
  name: string;
  url: string;
}

export function useGitSettings(fs: ReturnType<typeof useFileSystem>) {
  const ui = useUI();
  const [lastUpdate, setLastUpdate] = createSignal(Date.now());

  // Workspace configuration state
  const [userName, setUserName] = createSignal("");
  const [userEmail, setUserEmail] = createSignal("");

  // SSH/PAT Info
  const [credentialHelper, setCredentialHelper] = createSignal("");

  // Fetch Remotes
  const fetchRemotes = async (path: string | null, _ts: number) => {
    if (!path) return [];
    try {
      const remotes = await invoke<GitRemote[]>("git_get_remotes", { path });
      // git remote -v usually duplicates fetch and push, let's deduplicate by name
      const uniqueRemotes: Record<string, GitRemote> = {};
      for (const r of remotes) {
        if (!uniqueRemotes[r.name]) {
          uniqueRemotes[r.name] = r;
        }
      }
      return Object.values(uniqueRemotes);
    } catch (e) {
      console.error("Failed to fetch remotes", e);
      return [];
    }
  };

  const [remotes, { mutate: setRemotes }] = createResource(
    () => [fs.rootPath(), lastUpdate()] as const,
    ([path, ts]) => fetchRemotes(path, ts)
  );

  // Form UI states
  const [newRemoteName, setNewRemoteName] = createSignal("origin");
  const [newRemoteUrl, setNewRemoteUrl] = createSignal("");
  const [localNameInput, setLocalNameInput] = createSignal("");
  const [localEmailInput, setLocalEmailInput] = createSignal("");

  // Fetch Configurations
  const fetchConfig = async () => {
    const path = fs.rootPath();
    if (!path) return;
    try {
      const name = await invoke<string>("git_get_config", { path, key: "user.name" });
      const email = await invoke<string>("git_get_config", { path, key: "user.email" });
      const helper = await invoke<string>("git_get_config", { path, key: "credential.helper" });
      setUserName(name || "");
      setUserEmail(email || "");
      setLocalNameInput(name || "");
      setLocalEmailInput(email || "");
      setCredentialHelper(helper || "");
    } catch (e) {
      console.error("Failed to fetch git config", e);
    }
  };

  // Load config on mount or root path change
  createResource(fs.rootPath, () => fetchConfig());

  // Actions
  const handleAddRemote = async () => {
    const name = newRemoteName();
    const url = newRemoteUrl();
    if (!name || !url) return false;
    
    const path = fs.rootPath();
    if (!path) return false;
    try {
      await invoke("git_set_remote", { path, remote: name, url });
      setLastUpdate(Date.now());
      ui.showToast("Remote Added", `Successfully added remote '${name}'`, { variant: "success" });
      setNewRemoteName("origin");
      setNewRemoteUrl("");
      return true;
    } catch (e: any) {
      ui.showToast("Failed to Add Remote", e.toString(), { variant: "error" });
      return false;
    }
  };

  const removeRemote = async (name: string) => {
    const path = fs.rootPath();
    if (!path) return false;
    try {
      await invoke("git_remove_remote", { path, remote: name });
      setLastUpdate(Date.now());
      ui.showToast("Remote Removed", `Successfully removed remote '${name}'`, { variant: "success" });
      return true;
    } catch (e: any) {
      ui.showToast("Failed to Remove Remote", e.toString(), { variant: "error" });
      return false;
    }
  };

  const handleSaveConfig = async () => {
    const path = fs.rootPath();
    if (!path) return false;
    const name = localNameInput();
    const email = localEmailInput();
    try {
      if (name) await invoke("git_set_config", { path, key: "user.name", value: name });
      if (email) await invoke("git_set_config", { path, key: "user.email", value: email });
      setUserName(name);
      setUserEmail(email);
      ui.showToast("Config Saved", "Workspace Git configuration saved successfully.", { variant: "success" });
      return true;
    } catch (e: any) {
      ui.showToast("Failed to Save Config", e.toString(), { variant: "error" });
      return false;
    }
  };

  const setCredentialHelperConfig = async (helper: string) => {
    const path = fs.rootPath();
    if (!path) return false;
    try {
      await invoke("git_set_config", { path, key: "credential.helper", value: helper });
      setCredentialHelper(helper);
      ui.showToast("Credential Helper Set", `Configured Git to use '${helper}'`, { variant: "success" });
      return true;
    } catch (e: any) {
      ui.showToast("Failed to Set Credential Helper", e.toString(), { variant: "error" });
      return false;
    }
  };

  return {
    remotes,
    userName,
    userEmail,
    credentialHelper,
    // UI states
    newRemoteName,
    setNewRemoteName,
    newRemoteUrl,
    setNewRemoteUrl,
    localNameInput,
    setLocalNameInput,
    localEmailInput,
    setLocalEmailInput,
    // Actions
    handleAddRemote,
    removeRemote,
    handleSaveConfig,
    setCredentialHelperConfig,
    refresh: () => {
      setLastUpdate(Date.now());
      fetchConfig();
    }
  };
}
