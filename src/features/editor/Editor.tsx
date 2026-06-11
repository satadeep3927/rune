import { Show } from "solid-js";
import { CodeMirrorView } from "./CodeMirrorView";
import { CodeMirrorMergeView } from "./CodeMirrorMergeView";
import { ImageViewer } from "./ImageViewer";
import { PdfViewer } from "./PdfViewer";
import { MarkdownPreview } from "./MarkdownPreview";
import { SettingsView } from "@/components/SettingsView";
import { GitSettingsView } from "@/features/git/GitSettingsView";
import { useEditor } from "@/hooks/useEditor";
import { cn } from "@/utils/cn";
import type { MdMode } from "@/types";
import { tabStore } from "@/stores/tabs";

interface EditorProps {
  tabId: string;
  isActive?: boolean;
}

export function Editor(props: EditorProps) {
  const { mdMode, setMdMode, editorScroller, setEditorScroller } = useEditor();
  const tab = () => tabStore.tabs().find((t) => t.id === props.tabId);

  const handleEditorChange = (content: string) => {
    tabStore.updateTabContent(props.tabId, content);
  };

  return (
    <Show when={tab()}>
      <div class="flex-1 h-full overflow-hidden flex flex-col">
        <Show when={tab()!.fileType === "markdown"}>
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
        <Show
          when={
            tab()!.fileType === "image" && tab()!.dataUrl
          }
        >
          <ImageViewer
            dataUrl={tab()!.dataUrl!}
            fileName={tab()!.fileName ?? ""}
          />
        </Show>

        <Show
          when={tab()!.fileType === "pdf" && tab()!.dataUrl}
        >
          <PdfViewer dataUrl={tab()!.dataUrl!} fileName={tab()!.fileName ?? ""} />
        </Show>

        <Show
          when={tab()!.fileType === "text" && props.tabId}
        >
          <Show
            when={tab()!.isDiff}
            fallback={
              <CodeMirrorView
                tabId={props.tabId}
                content={tab()!.content}
                language={tab()!.language}
                onChange={handleEditorChange}
                isActive={props.isActive}
              />
            }
          >
            <CodeMirrorMergeView
              tabId={props.tabId}
              originalContent={tab()!.diffOriginalContent ?? ""}
              currentContent={tab()!.content}
              language={tab()!.language}
              onChange={handleEditorChange}
            />
          </Show>
        </Show>

        <Show
          when={
            tab()!.fileType === "markdown" && props.tabId
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
                  content={tab()!.content}
                  language="markdown"
                  onChange={handleEditorChange}
                  onScrollerRef={
                    mdMode() === "split" ? setEditorScroller : undefined
                  }
                />
              </div>
            </Show>
            <Show when={mdMode() === "preview" || mdMode() === "split"}>
              <div class={mdMode() === "split" ? "w-1/2" : "w-full"}>
                <MarkdownPreview
                  content={tab()!.content}
                  editorScrollElement={
                    mdMode() === "split" ? editorScroller() : undefined
                  }
                />
              </div>
            </Show>
          </div>
        </Show>

        <Show when={tab()!.fileType === "settings"}>
          <SettingsView />
        </Show>
        <Show when={tab()!.fileType === "git-settings"}>
          <GitSettingsView tabId={props.tabId!} />
        </Show>
      </div>
    </div>
    </Show>
  );
}
