export function getStatusBadge(status: string) {
  if (status === "??") return { letter: "U", color: "#73c991" }; // muted green
  if (status.includes("A")) return { letter: "A", color: "#73c991" };
  if (status.includes("M")) return { letter: "M", color: "#e2c08d" }; // muted yellow
  if (status.includes("D")) return { letter: "D", color: "#f48771" }; // muted red
  if (status.includes("R")) return { letter: "R", color: "#73c991" };
  return { letter: "M", color: "#e2c08d" };
}

export function parseGitFile(filePath: string, status: string) {
  const fileName = filePath.split("/").pop()!;
  const lastSlashIndex = filePath.lastIndexOf("/");
  const dirName =
    lastSlashIndex !== -1 ? filePath.substring(0, lastSlashIndex) : "";
  const isDeleted = status.includes("D");

  return { fileName, dirName, isDeleted };
}
