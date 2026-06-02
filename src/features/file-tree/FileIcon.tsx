import { createSignal, createEffect } from "solid-js";
import { getFileIconName, getFolderIconName, getSvg, fetchSvg } from "../../utils/iconMap";

interface FileIconProps {
  name: string;
  isDirectory: boolean;
  isExpanded?: boolean;
}

export function FileIcon(props: FileIconProps) {
  const iconName = () => {
    if (props.isDirectory) {
      return getFolderIconName(props.name, props.isExpanded ?? false);
    }
    return getFileIconName(props.name);
  };

  const [svg, setSvg] = createSignal<string | undefined>(undefined);

  createEffect(() => {
    const name = iconName();
    const cached = getSvg(name);
    if (cached) {
      setSvg(cached);
    } else {
      fetchSvg(name).then(s => {
        // Only update if still the same icon
        if (iconName() === name) setSvg(s);
      });
    }
  });

  return (
    <span
      class="shrink-0 inline-flex items-center justify-center"
      style={{ width: "16px", height: "16px", "pointer-events": "none" }}
      innerHTML={svg() ? svg()! : '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"></svg>'}
    />
  );
}
