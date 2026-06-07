import type { RunePlugin, RuneAPI } from "@/plugins/types";
import { iconMap, svgData } from "./file-icons-data";

const extMap: Record<string, string> =
  (iconMap.fileExtensions as Record<string, string>) ?? {};
const fileNameMap: Record<string, string> =
  (iconMap.fileNames as Record<string, string>) ?? {};

const folderMap: Record<string, string> =
  (iconMap.folderNames as Record<string, string>) ?? {};
const folderExpandedMap: Record<string, string> =
  (iconMap.folderNamesExpanded as Record<string, string>) ?? {};

function getFileIconName(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (fileNameMap[lower]) return fileNameMap[lower];
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex > 0) {
    const ext = fileName.slice(dotIndex + 1).toLowerCase();
    if (extMap[ext]) return extMap[ext];
  }
  return "file";
}

function getFolderIconName(folderName: string, expanded: boolean): string {
  const lower = folderName.toLowerCase();
  if (expanded && folderExpandedMap[lower]) return folderExpandedMap[lower];
  if (folderMap[lower]) return folderMap[lower];
  return expanded ? "folder-open" : "folder";
}

const fileIconsPlugin: RunePlugin = {
  id: "core.file-icons",
  name: "File Icons",
  version: "1.0.0",
  type: "builtin",
  permissions: [],
  activate(api: RuneAPI) {
    api.ui.registerIconProvider({
      id: "core.file-icons",
      getFileIcon: async (fileName: string) => {
        const iconName = getFileIconName(fileName);
        return svgData[iconName] || "";
      },
      getFolderIcon: async (folderName: string, expanded: boolean) => {
        const iconName = getFolderIconName(folderName, expanded);
        return svgData[iconName] || "";
      },
    });
  },
};

export default fileIconsPlugin;
