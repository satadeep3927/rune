import { getFileIconName, getFolderIconName } from "../../utils/iconMap";

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

  return (
    <img
      src={`/icons/${iconName()}.svg`}
      alt=""
      width="16"
      height="16"
      class="shrink-0"
      style={{ "pointer-events": "none" }}
      draggable={false}
    />
  );
}
