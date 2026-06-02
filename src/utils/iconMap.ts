let extMap: Record<string, string> = {};
let fileNameMap: Record<string, string> = {};
let folderMap: Record<string, string> = {};
let folderExpandedMap: Record<string, string> = {};
let loaded = false;

// SVG cache: iconName -> SVG content string
const svgCache = new Map<string, string>();
// Pending fetches to avoid duplicate requests
const pendingFetches = new Map<string, Promise<string>>();

async function fetchSvg(iconName: string): Promise<string> {
  if (svgCache.has(iconName)) return svgCache.get(iconName)!;
  if (pendingFetches.has(iconName)) return pendingFetches.get(iconName)!;

  const promise = fetch(`/icons/${iconName}.svg`)
    .then(r => r.ok ? r.text() : "")
    .then(svg => {
      svgCache.set(iconName, svg);
      pendingFetches.delete(iconName);
      return svg;
    })
    .catch(() => {
      pendingFetches.delete(iconName);
      return "";
    });

  pendingFetches.set(iconName, promise);
  return promise;
}

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

    // Preload common icons in background
    const commonIcons = ["file", "folder", "folder-open", "typescript", "javascript", "json", "html", "css", "markdown", "python", "rust"];
    for (const name of commonIcons) {
      fetchSvg(name);
    }
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

export function getSvg(iconName: string): string | undefined {
  return svgCache.get(iconName);
}

export { fetchSvg };
