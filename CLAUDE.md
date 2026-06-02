# Rune Editor

A lightweight, extensible code editor built with Tauri 2 + SolidJS + Rust.

## Tech Stack

| Layer | Tech |
|-------|------|
| Shell | Tauri 2 (Rust backend) |
| Frontend | SolidJS, TypeScript |
| Styling | Tailwind CSS v4 |
| Components | ShadCN-Solid / Radix primitives |
| State | Solid signals + stores |
| Editor | CodeMirror 6 |
| Data fetching | TanStack Query (Solid) if needed |

## Architecture Principles

- **Modular design** — every feature lives in its own directory under `src/` with its own components, hooks, and types.
- **Custom hooks over inline logic** — extract reactive logic into `src/hooks/` or feature-local hooks. Components should be thin wrappers.
- **Sharp design** — hard edges, no border-radius excessive, crisp lines. Default theme: dark bg (#0B0F00) + lime (#00ff41) accents.

## Directory Structure (target)

```
src/
  app/            # Root layout, theme provider
  components/     # Shared UI primitives (Button, etc.)
  features/
    titlebar/     # Custom titlebar + menus
    file-tree/    # File explorer sidebar
    editor/       # CodeMirror wrapper + tabs
    theme/        # Theme config + switcher
  hooks/          # Shared custom hooks
  stores/         # Global signal stores
  styles/         # Tailwind entry, CSS variables
  types/          # Shared TypeScript types
  utils/          # Pure helper functions
```

## Commands

```bash
pnpm install          # Install frontend deps
pnpm tauri dev        # Dev server + Tauri window
pnpm tauri build      # Production build
pnpm build            # Frontend-only build
```

## Design System

- Default theme: **Obsidian + Lime** — dark backgrounds (`#0B0F00`), lime accents (`#00ff41`), monospace everything.
- All colors driven by CSS custom properties so themes are swappable.
- Sharp corners (border-radius: 0 or 2px max). No soft/rounded UI.
- Thin 1px borders, high contrast.

## Key Dependencies

- `tailwindcss` + `@tailwindcss/vite` (v4)
- `@kobalte/core` (ShadCN-Solid primitives)
- CodeMirror 6: `@codemirror/view`, `@codemirror/state`, `@codemirror/commands`, `@codemirror/autocomplete`, `@codemirror/language`, `@codemirror/search`, `@codemirror/lang-*`
- `@tauri-apps/plugin-fs`, `@tauri-apps/plugin-dialog`
- `tauri-plugin-fs`, `tauri-plugin-dialog` (Rust side)

## Tauri Notes

- Custom titlebar requires `decorations: false` in tauri.conf.json + `data-tauri-drag-region` on the titlebar element.
- File system access via Tauri commands (Rust `fs` + `dialog` plugins).
