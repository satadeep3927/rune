import { Show } from "solid-js";
import { useIndexerProgress } from "@/hooks/useIndexerProgress";
import { SpinnerIcon } from "@/components/ui/icons/SpinnerIcon";

export function IndexerProgress() {
  const { progress, isIndexing } = useIndexerProgress();

  return (
    <Show when={isIndexing()}>
      <div
        class="flex items-center gap-2 h-full px-2 text-[var(--color-fg-muted)] text-[11px] border-r border-[var(--color-border)] no-drag"
        style={{ "-webkit-app-region": "no-drag" }}
        title={progress()}
      >
        <SpinnerIcon class="h-3 w-3 text-[var(--color-accent)]" />
      </div>
    </Show>
  );
}
