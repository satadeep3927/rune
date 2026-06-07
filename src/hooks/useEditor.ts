import { createSignal } from "solid-js";
import type { MdMode } from "@/types";

export function useEditor() {
  const [mdMode, setMdMode] = createSignal<MdMode>("edit");
  const [editorScroller, setEditorScroller] = createSignal<HTMLElement | null>(
    null,
  );

  return {
    mdMode,
    setMdMode,
    editorScroller,
    setEditorScroller,
  };
}
