import { For } from "solid-js";
import { CustomSelect } from "./CustomSelect";
import { Input } from "@/components/ui/Input";
import {
  useFileAssociations,
  type FileAssociationType,
} from "@/hooks/useFileAssociations";

export function FileAssociationsForm() {
  const {
    newExt,
    setNewExt,
    newType,
    setNewType,
    entries,
    handleAdd,
    handleRemove,
  } = useFileAssociations();

  const typeOptions = [
    { label: "Text Editor", value: "text" },
    { label: "Image Viewer", value: "image" },
    { label: "PDF Viewer", value: "pdf" },
    { label: "Markdown Editor", value: "markdown" },
  ];

  return (
    <div class="flex flex-col gap-4 mt-2">
      <p class="text-sm text-[var(--color-fg-muted)]">
        Override default editors for specific file extensions.
      </p>

      <div class="flex items-center gap-2">
        <Input
          type="text"
          placeholder="Extension (e.g. log)"
          value={newExt()}
          onInput={(e) => setNewExt(e.currentTarget.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          class="w-48"
        />
        <CustomSelect
          value={newType()}
          options={typeOptions}
          onChange={(v) => setNewType(v as FileAssociationType)}
          width="160px"
        />
        <button
          onClick={handleAdd}
          class="px-4 py-1.5 rounded-md font-medium text-sm transition-colors"
          style={{
            background: "var(--color-accent)",
            color: "var(--color-bg)",
          }}
        >
          Add
        </button>
      </div>

      <div class="flex flex-col gap-2 mt-4">
        <For each={entries()}>
          {([ext, type]) => (
            <div class="flex items-center justify-between p-3 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] max-w-md">
              <div class="flex items-center gap-4">
                <span class="font-mono text-sm font-bold text-[var(--color-accent)]">
                  .{ext}
                </span>
                <span class="text-sm text-[var(--color-fg-muted)]">
                  {typeOptions.find((o) => o.value === type)?.label || type}
                </span>
              </div>
              <button
                onClick={() => handleRemove(ext)}
                class="text-sm px-2 py-1 hover:text-[var(--color-error)] text-[var(--color-fg-muted)] transition-colors"
              >
                Remove
              </button>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
