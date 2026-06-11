import { Show, For } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { remove } from "@tauri-apps/plugin-fs";
import {
  GitCommit,
  Plus,
  Minus,
  RefreshCw,
  Upload,
  Download,
  FolderGit2,
  Undo,
  Loader2,
  Settings,
} from "lucide-solid";
import { Button } from "@/components/ui/Button";
import { useUI } from "@/contexts/UIContext";
import { useGitView } from "@/hooks/useGitView";
import { GitFileItem } from "@/components/ui/GitFileItem";
import { tabStore } from "@/stores/tabs";

interface GitViewProps {
  fs: any;
  width: number;
  onOpenFile: (
    path: string,
    options?: { isDiff?: boolean; diffOriginalContent?: string },
  ) => void;
}

export function GitView(props: GitViewProps) {
  const git = useGitView(props.fs);
  const ui = useUI();

  return (
    <div
      class="h-full w-full flex flex-col p-3 overflow-y-auto"
      style={{ color: "var(--color-fg)" }}
    >
      <Show
        when={!git.isLoading()}
        fallback={
          <div class="flex flex-col items-center justify-center h-full gap-4 text-center">
            <Loader2
              size={24}
              class="animate-spin"
              style={{ color: "var(--color-fg-muted)" }}
            />
          </div>
        }
      >
        <Show
          when={git.isRepo()}
          fallback={
            <div class="flex flex-col gap-4">
              <div class="flex items-center justify-between mb-2">
                <span
                  class="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--color-fg-muted)" }}
                >
                  Source Control
                </span>
              </div>
              <div class="flex flex-col gap-2">
                <p class="text-sm" style={{ color: "var(--color-fg-muted)" }}>
                  No Git repository found in the current folder.
                </p>
                <Button
                  onClick={git.init}
                  variant="primary"
                  class="w-full justify-center flex items-center gap-2"
                >
                  <FolderGit2 size={14} />
                  Initialize Repository
                </Button>
              </div>
            </div>
          }
        >
          {/* Actions Header */}
          <div class="flex items-center justify-between mb-4 gap-2">
            <span
              class="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--color-fg-muted)" }}
            >
              Source Control
            </span>
            <div class="flex items-center gap-1">
              <button
                class="p-1 hover:text-[var(--color-accent)] transition-colors"
                onClick={() => {
                  tabStore.openTab(
                    "git://settings",
                    "Git Settings",
                    "",
                    "plaintext",
                    "git-settings",
                    undefined,
                    "left",
                  );
                }}
                title="Git Settings"
              >
                <Settings size={14} />
              </button>
              <button
                class="p-1 hover:text-[var(--color-accent)] transition-colors"
                onClick={git.refreshGit}
                title="Refresh"
              >
                <RefreshCw size={14} />
              </button>
              <button
                class={`p-1 transition-colors ${git.isPulling() ? "opacity-50 cursor-not-allowed" : "hover:text-[var(--color-accent)]"}`}
                onClick={async () => {
                  if (await git.handlePull())
                    ui.showToast(
                      "Pull Successful",
                      "Successfully pulled latest changes from remote.",
                      { variant: "success" },
                    );
                }}
                title="Pull"
                disabled={git.isPulling()}
              >
                <Show when={git.isPulling()} fallback={<Download size={14} />}>
                  <Loader2 size={14} class="animate-spin" />
                </Show>
              </button>
              <button
                class={`p-1 transition-colors ${git.isPushing() ? "opacity-50 cursor-not-allowed" : "hover:text-[var(--color-accent)]"}`}
                onClick={async () => {
                  if (await git.handlePush())
                    ui.showToast(
                      "Push Successful",
                      "Successfully pushed your commits to remote.",
                      { variant: "success" },
                    );
                }}
                title="Push"
                disabled={git.isPushing()}
              >
                <Show when={git.isPushing()} fallback={<Upload size={14} />}>
                  <Loader2 size={14} class="animate-spin" />
                </Show>
              </button>
            </div>
          </div>

          {/* Commit Input */}
          <div class="flex flex-col gap-2 mb-4">
            <textarea
              class="w-full p-2 text-sm resize-none rounded outline-none transition-colors"
              style={{
                background: "var(--color-bg-secondary)",
                border: "1px solid var(--color-border)",
                color: "var(--color-fg)",
              }}
              rows={3}
              placeholder="Commit message (Ctrl+Enter to commit)"
              value={git.commitMessage()}
              onInput={(e) => git.setCommitMessage(e.currentTarget.value)}
              onKeyDown={async (e) => {
                if (e.key === "Enter" && e.ctrlKey) {
                  e.preventDefault();
                  await git.handleCommit();
                }
              }}
            />
            <Button
              variant="primary"
              onClick={git.handleCommit}
              disabled={git.isCommitting() || !git.commitMessage().trim()}
              class="w-full justify-center flex items-center gap-2"
            >
              <GitCommit size={14} />
              Commit
            </Button>
          </div>

          {/* Changes List */}
          <div class="flex flex-col gap-4">
            <Show
              when={
                git
                  .gitState()
                  ?.status.filter(
                    (s) =>
                      s.status.startsWith("A") ||
                      s.status.startsWith("M") ||
                      s.status.startsWith("D") ||
                      s.status.startsWith("R"),
                  ).length! > 0
              }
            >
              <div class="flex flex-col gap-1">
                <span
                  class="text-[11px] font-semibold uppercase px-1"
                  style={{ color: "var(--color-fg-muted)" }}
                >
                  Staged Changes
                </span>
                <For
                  each={git
                    .gitState()
                    ?.status.filter(
                      (s) => s.status[0] !== " " && s.status[0] !== "?",
                    )}
                >
                  {(file) => (
                    <GitFileItem
                      file={file.file}
                      status={file.status}
                      onClick={async () => {
                        const isUntracked = file.status === "??";
                        const isConflicted =
                          file.status.includes("U") ||
                          file.status === "DD" ||
                          file.status === "AA";
                        if (isUntracked || isConflicted) {
                          props.onOpenFile(
                            `${props.fs.rootPath()}/${file.file}`,
                          );
                        } else {
                          const diff = await git.getFileDiff(file.file);
                          props.onOpenFile(
                            `${props.fs.rootPath()}/${file.file}`,
                            {
                              isDiff: true,
                              diffOriginalContent: diff,
                            },
                          );
                        }
                      }}
                      actions={[
                        {
                          icon: Minus,
                          title: "Unstage Change",
                          hoverColor: "hover:text-red-400",
                          onClick: (e) => {
                            e.stopPropagation();
                            git.unstageFiles([file.file]);
                          },
                        },
                      ]}
                    />
                  )}
                </For>
              </div>
            </Show>

            <div class="flex flex-col gap-1">
              <div class="flex items-center justify-between group h-[22px]">
                <span
                  class="text-[11px] font-semibold uppercase px-1"
                  style={{ color: "var(--color-fg-muted)" }}
                >
                  Changes
                </span>
                <Show
                  when={
                    git.gitState()?.status.filter((s) => s.status[1] !== " ")
                      .length! > 0
                  }
                >
                  <button
                    class="opacity-0 group-hover:opacity-100 p-1 hover:text-[var(--color-success)] transition-opacity"
                    onClick={() =>
                      git.stageFiles(
                        git
                          .gitState()
                          ?.status.filter(
                            (s) => s.status[1] !== " " || s.status === "??",
                          )
                          .map((f) => f.file) || [],
                      )
                    }
                    title="Stage All Changes"
                  >
                    <Plus size={12} />
                  </button>
                </Show>
              </div>
              <Show
                when={
                  git.gitState()?.status.filter((s) => s.status[1] !== " ")
                    .length! > 0
                }
                fallback={
                  <div
                    class="px-2 text-xs"
                    style={{ color: "var(--color-fg-muted)" }}
                  >
                    No changes
                  </div>
                }
              >
                <For
                  each={git
                    .gitState()
                    ?.status.filter(
                      (s) => s.status[1] !== " " || s.status === "??",
                    )}
                >
                  {(file) => (
                    <GitFileItem
                      file={file.file}
                      status={file.status}
                      onClick={async () => {
                        const isUntracked = file.status === "??";
                        const isConflicted =
                          file.status.includes("U") ||
                          file.status === "DD" ||
                          file.status === "AA";
                        if (isUntracked || isConflicted) {
                          props.onOpenFile(
                            `${props.fs.rootPath()}/${file.file}`,
                          );
                        } else {
                          const diff = await git.getFileDiff(file.file);
                          props.onOpenFile(
                            `${props.fs.rootPath()}/${file.file}`,
                            {
                              isDiff: true,
                              diffOriginalContent: diff,
                            },
                          );
                        }
                      }}
                      actions={[
                        {
                          icon: Undo,
                          title: "Discard Change",
                          hoverColor: "hover:text-red-400",
                          onClick: async (e) => {
                            e.stopPropagation();
                            if (file.status === "??") {
                              const confirmed = await ui.showConfirmDialog(
                                `Are you sure you want to delete ${file.file.split(/[\\/]/).pop()}?\nThis action is irreversible!`,
                                { variant: "danger", okLabel: "Delete File" },
                              );
                              if (confirmed) {
                                try {
                                  await remove(
                                    `${props.fs.rootPath()}/${file.file}`,
                                  );
                                  git.refreshGit();
                                } catch (err) {
                                  console.error(
                                    "Failed to delete untracked file:",
                                    err,
                                  );
                                }
                              }
                            } else {
                              git.discardChanges([file.file]);
                            }
                          },
                        },
                        {
                          icon: Plus,
                          title: "Stage Change",
                          hoverColor: "hover:text-[var(--color-success)]",
                          onClick: (e) => {
                            e.stopPropagation();
                            git.stageFiles([file.file]);
                          },
                        },
                      ]}
                    />
                  )}
                </For>
              </Show>
            </div>
          </div>
        </Show>
      </Show>
    </div>
  );
}
