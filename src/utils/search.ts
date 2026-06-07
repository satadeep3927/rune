export function shouldSkip(name: string): boolean {
  return (
    name.startsWith(".") ||
    name === "node_modules" ||
    name === "target" ||
    name === "dist" ||
    name === ".git"
  );
}

export const BINARY_EXTS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "svg",
  "bmp",
  "webp",
  "ico",
  "pdf",
  "zip",
  "tar",
  "gz",
  "woff",
  "woff2",
  "ttf",
  "eot",
  "exe",
  "dll",
  "so",
  "dylib",
]);

export function isBinary(name: string): boolean {
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
  return BINARY_EXTS.has(ext);
}
