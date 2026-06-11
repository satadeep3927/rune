import { Show } from "solid-js";
import { CodeMirrorView } from "./CodeMirrorView";
import { CodeMirrorMergeView } from "./CodeMirrorMergeView";
import { ImageViewer } from "./ImageViewer";
import { PdfViewer } from "./PdfViewer";
import { MarkdownPreview } from "./MarkdownPreview";
import { SettingsView } from "@/components/SettingsView";
import { WelcomeScreen } from "@/features/welcome/WelcomeScreen";
import { GitSettingsView } from "@/features/git/GitSettingsView";
import { useEditor } from "@/hooks/useEditor";
import { cn } from "@/utils/cn";
import type { FileType, MdMode } from "@/types";

interface EditorProps {
  content: string;
  language: string;
  isDirty: boolean;
  onChange?: (content: string) => void;
  hasOpenFile: boolean;
  tabId: string | null;
  fileType: FileType;
  dataUrl?: string;
  fileName?: string;
  isDiff?: boolean;
  diffOriginalContent?: string;
  onCreateFile?: () => void;
  onOpenFolder?: () => void;
  onOpenCommandPalette?: () => void;
  onSearchWorkspace?: () => void;
}

export function Editor(props: EditorProps) {
  const { mdMode, setMdMode, editorScroller, setEditorScroller } = useEditor();

  return (
    <div class="flex-1 h-full overflow-hidden flex flex-col">
      <Show when={props.hasOpenFile && props.fileType === "markdown"}>
        <div class="flex items-center gap-1 px-2 h-[28px] shrink-0 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
          {(["edit", "preview", "split"] as MdMode[]).map((mode) => (
            <button
              class={cn(
                "px-2 py-0.5 text-[11px] uppercase tracking-wide transition-colors border-none cursor-pointer",
                mdMode() === mode
                  ? "text-[var(--color-accent)] bg-[var(--color-bg-tertiary)]"
                  : "text-[var(--color-fg-muted)] bg-transparent",
              )}
              onClick={() => setMdMode(mode)}
            >
              {mode}
            </button>
          ))}
        </div>
      </Show>

      <div class="flex-1 overflow-hidden">
        <Show when={!props.hasOpenFile}>
          <div class="h-full">
            <WelcomeScreen onOpenCommandPalette={props.onOpenCommandPalette!} />
          </div>
        </Show>

        <Show
          when={
            props.hasOpenFile && props.fileType === "image" && props.dataUrl
          }
        >
          <ImageViewer
            dataUrl={props.dataUrl!}
            fileName={props.fileName ?? ""}
          />
        </Show>

        <Show
          when={props.hasOpenFile && props.fileType === "pdf" && props.dataUrl}
        >
          <PdfViewer dataUrl={props.dataUrl!} fileName={props.fileName ?? ""} />
        </Show>

        <Show
          when={props.hasOpenFile && props.fileType === "text" && props.tabId}
        >
          <Show
            when={props.isDiff}
            fallback={
              <CodeMirrorView
                tabId={props.tabId}
                content={props.content}
                language={props.language}
                onChange={props.onChange}
              />
            }
          >
            <CodeMirrorMergeView
              tabId={props.tabId}
              originalContent={props.diffOriginalContent ?? ""}
              currentContent={props.content}
              language={props.language}
              onChange={props.onChange}
            />
          </Show>
        </Show>

        <Show
          when={
            props.hasOpenFile && props.fileType === "markdown" && props.tabId
          }
        >
          <div class="flex h-full">
            <Show when={mdMode() === "edit" || mdMode() === "split"}>
              <div
                class={cn(
                  mdMode() === "split"
                    ? "w-1/2 border-r border-[var(--color-border)]"
                    : "w-full",
                )}
              >
                <CodeMirrorView
                  tabId={props.tabId}
                  content={props.content}
                  language="markdown"
                  onChange={props.onChange}
                  onScrollerRef={
                    mdMode() === "split" ? setEditorScroller : undefined
                  }
                />
              </div>
            </Show>
            <Show when={mdMode() === "preview" || mdMode() === "split"}>
              <div class={mdMode() === "split" ? "w-1/2" : "w-full"}>
                <MarkdownPreview
                  content={props.content}
                  editorScrollElement={
                    mdMode() === "split" ? editorScroller() : undefined
                  }
                />
              </div>
            </Show>
          </div>
        </Show>

        <Show when={props.hasOpenFile && props.fileType === "settings"}>
          <SettingsView />
        </Show>
        <Show when={props.hasOpenFile && props.fileType === "git-settings"}>
          <GitSettingsView tabId={props.tabId!} />
        </Show>
      </div>
    </div>
  );
}
