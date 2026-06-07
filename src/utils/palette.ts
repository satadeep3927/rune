export const SYMBOL_ICONS: Record<
  string,
  { d: string; color: string; label: string }
> = {
  function: {
    d: "M4 17.5V6.5L8 12l-4 5.5M12 6.5l4 5.5-4 5.5M20 6.5v11",
    color: "#b180d7",
    label: "fn",
  },
  fn: {
    d: "M4 17.5V6.5L8 12l-4 5.5M12 6.5l4 5.5-4 5.5M20 6.5v11",
    color: "#b180d7",
    label: "fn",
  },
  def: {
    d: "M4 17.5V6.5L8 12l-4 5.5M12 6.5l4 5.5-4 5.5M20 6.5v11",
    color: "#b180d7",
    label: "fn",
  },
  class: {
    d: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
    color: "#e5c07b",
    label: "C",
  },
  struct: {
    d: "M3 3h18v18H3zM3 9h18M3 15h18M9 3v18",
    color: "#56b6c2",
    label: "S",
  },
  const: { d: "M12 2L2 7l10 5 10-5-10-5z", color: "#4fc1ff", label: "K" },
};

export const DEFAULT_ICON = {
  d: "M4 17.5V6.5L8 12l-4 5.5M12 6.5l4 5.5-4 5.5M20 6.5v11",
  color: "#7a8394",
  label: "?",
};

export const EXT_COLORS: Record<string, string> = {
  ts: "#3178c6",
  tsx: "#3178c6",
  js: "#f0db4f",
  jsx: "#f0db4f",
  rs: "#dea584",
  py: "#3572A5",
  html: "#e34c26",
  css: "#563d7c",
  json: "#cbcb41",
  md: "#519aba",
  toml: "#9c4221",
  yaml: "#cb171e",
  vue: "#41b883",
  go: "#00add8",
  java: "#b07219",
  cpp: "#f34b7d",
  sql: "#e38c00",
  php: "#4f5d95",
  xml: "#0060ac",
  sh: "#89e051",
};

export function getFileColor(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_COLORS[ext] ?? "var(--color-fg-muted)";
}
