let extMap: Record<string, string> = {};
let fileNameMap: Record<string, string> = {};
let folderMap: Record<string, string> = {};
let folderExpandedMap: Record<string, string> = {};
let loaded = false;

export async function loadIconMap(): Promise<void> {
  if (loaded) return;
  try {
    const res = await fetch("/icons/icon-map.json");
    const data = await res.json();
    extMap = data.fileExtensions ?? {};
    fileNameMap = data.fileNames ?? {};
    folderMap = data.folderNames ?? {};
    folderExpandedMap = data.folderNamesExpanded ?? {};
    loaded = true;
  } catch {
    loaded = true;
  }
}

export function getFileIconName(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (fileNameMap[lower]) return fileNameMap[lower];
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex > 0) {
    const ext = fileName.slice(dotIndex + 1).toLowerCase();
    if (extMap[ext]) return extMap[ext];
  }
  return "file";
}

export function getFolderIconName(folderName: string, expanded: boolean): string {
  const lower = folderName.toLowerCase();
  if (expanded && folderExpandedMap[lower]) return folderExpandedMap[lower];
  if (folderMap[lower]) return folderMap[lower];
  return expanded ? "folder-open" : "folder";
}
