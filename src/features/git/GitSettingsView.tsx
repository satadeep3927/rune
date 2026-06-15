import { For, Show } from "solid-js";
import { useGitSettings } from "@/hooks/useGitSettings";
import { useFileSystem } from "@/hooks/useFileSystem";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SettingRow } from "@/components/settings/SettingRow";
import { CustomSelect } from "@/components/settings/CustomSelect";
import { Trash2 } from "lucide-solid";

export function GitSettingsView(_props: { tabId: string }) {
  const fs = useFileSystem();
  const git = useGitSettings(fs);

  return (
    <div
      class="h-full w-full overflow-y-auto p-8"
      style={{ color: "var(--color-fg)", background: "var(--color-bg)" }}
    >
      <div class="max-w-3xl mx-auto flex flex-col pb-12">
        <h1 class="text-3xl font-bold mb-8">Git Settings</h1>

        <section class="mb-8">
          <h2 class="text-xl font-semibold mb-2 text-[var(--color-accent)]">
            Workspace Identity
          </h2>

          <SettingRow
            label="Name"
            description="Set the user.name for this repository. Overrides global."
          >
            <Input
              value={git.localNameInput()}
              onInput={(e) => git.setLocalNameInput(e.currentTarget.value)}
              placeholder="John Doe"
              class="w-full"
            />
          </SettingRow>

          <SettingRow
            label="Email"
            description="Set the user.email for this repository. Overrides global."
          >
            <Input
              value={git.localEmailInput()}
              onInput={(e) => git.setLocalEmailInput(e.currentTarget.value)}
              placeholder="john@example.com"
              class="w-full"
            />
          </SettingRow>

          <div class="flex justify-end pt-4">
            <Button onClick={git.handleSaveConfig} variant="primary">
              Save Identity
            </Button>
          </div>
        </section>

        <section class="mb-8">
          <h2 class="text-xl font-semibold mb-2 text-[var(--color-accent)]">
            Remote Repositories
          </h2>

          <Show when={git.remotes()?.length === 0}>
            <div class="py-4 border-b border-[var(--color-border)]">
              <span
                class="text-sm italic"
                style={{ color: "var(--color-fg-muted)" }}
              >
                No remotes configured.
              </span>
            </div>
          </Show>

          <For each={git.remotes()}>
            {(remote) => (
              <div class="flex items-center justify-between py-4 border-b border-[var(--color-border)]">
                <div class="flex flex-col pr-8">
                  <span class="font-medium text-sm">{remote.name}</span>
                  <span class="text-xs text-[var(--color-fg-muted)] mt-1 font-mono">
                    {remote.url}
                  </span>
                </div>
                <div class="shrink-0 flex items-center justify-end">
                  <button
                    class="p-2 rounded hover:bg-red-500/10 text-[var(--color-fg-muted)] hover:text-red-500 transition-colors"
                    onClick={() => git.removeRemote(remote.name)}
                    title="Remove Remote"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )}
          </For>

          <div class="mt-8">
            <h3 class="font-medium text-sm mb-4">Add New Remote</h3>
            <div class="flex items-start gap-4">
              <div class="w-1/3">
                <Input
                  value={git.newRemoteName()}
                  onInput={(e) => git.setNewRemoteName(e.currentTarget.value)}
                  placeholder="Name (e.g. origin)"
                  class="w-full"
                />
              </div>
              <div class="flex-1 flex gap-2">
                <Input
                  value={git.newRemoteUrl()}
                  onInput={(e) => git.setNewRemoteUrl(e.currentTarget.value)}
                  placeholder="URL (https://... or git@...)"
                  class="w-full"
                />
                <Button
                  onClick={git.handleAddRemote}
                  disabled={!git.newRemoteName() || !git.newRemoteUrl()}
                  class="shrink-0"
                >
                  Add Remote
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section class="mb-8">
          <h2 class="text-xl font-semibold mb-2 text-[var(--color-accent)]">
            Authentication (SSH & PAT)
          </h2>

          <SettingRow
            label="Credential Helper"
            description="Use a helper to cache Personal Access Tokens (PAT) for HTTPS."
          >
            <CustomSelect
              value={git.credentialHelper() || "none"}
              onChange={(v) =>
                git.setCredentialHelperConfig(v === "none" ? "" : v)
              }
              options={[
                { label: "None (Prompt every time)", value: "none" },
                { label: "Credential Manager", value: "manager" },
                { label: "Local Store", value: "store" },
                { label: "Memory Cache", value: "cache" },
              ]}
              width="240px"
            />
          </SettingRow>

          <div
            class="py-4 text-sm leading-relaxed"
            style={{ color: "var(--color-fg-muted)" }}
          >
            <p class="mb-2">
              <strong class="text-[var(--color-fg)]">SSH Keys:</strong> To
              authenticate via SSH, ensure your remote URL starts with{" "}
              <code>git@</code> (e.g. <code>git@github.com:user/repo.git</code>
              ). Git will automatically use the keys located in your{" "}
              <code>~/.ssh/</code> directory.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
