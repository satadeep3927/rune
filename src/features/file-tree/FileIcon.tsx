import { createSignal, createEffect } from "solid-js";
import { pluginRegistry } from "@/plugins/registry";

interface FileIconProps {
  name: string;
  isDirectory: boolean;
  isExpanded?: boolean;
}

export function FileIcon(props: FileIconProps) {
  const [svg, setSvg] = createSignal<string | undefined>(undefined);

  createEffect(() => {
    const iconResult = pluginRegistry.getIcon(
      props.name,
      props.isDirectory,
      props.isExpanded ?? false,
    );
    if (iconResult instanceof Promise) {
      iconResult.then((s) => setSvg(s));
    } else {
      setSvg(iconResult);
    }
  });

  return (
    <span
      class="shrink-0 inline-flex items-center justify-center"
      style={{ width: "16px", height: "16px", "pointer-events": "none" }}
      innerHTML={
        svg()
          ? svg()!
          : '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"></svg>'
      }
    />
  );
}
