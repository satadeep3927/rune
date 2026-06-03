<h1 align="center">
  <img src="public/logo.svg" width="40" alt="Rune Logo" />
  RUNE
</h1>

Rune isn't just another code editor—it's built to get out of your way. We started Rune with a simple idea: coding should feel fast, fluid, and fun. No bloated electron memory hogs, no endless loading bars, just pure performance in a minimalist, distraction-free environment.

Built with modern web technologies on the frontend (SolidJS) and a lightning-fast Rust backend (Tauri), Rune marries the beautiful aesthetics of web UI with the raw native performance of system languages.

### Core Philosophy

- **Speed Over Everything:** If it's not instant, it's a bug. From fuzzy finding your workspace to rendering massive log files, Rune is built to keep up with your brain.
- **Minimalist but Powerful:** You shouldn't have to navigate through 15 nested menus just to find a command. Our unified Command Palette does it all in one place.
- **Native Polish:** It feels like a native app because it uses native system APIs through Rust, including seamless file watching and ultra-fast I/O.

### 🔌 Plugin-First Architecture

Rune is designed to be extensible from the ground up. Almost every feature you interact with is actually a lightweight, hot-pluggable module:
- **Core Plugins:** Features like Code Intelligence, the Command Palette, and Open Recent files are all built as plugins.
- **Extensible:** The plugin system intercepts commands, registers UI components, and binds shortcuts. This means anyone can build a plugin that feels like a native part of the editor.
- **Sandboxed and Safe:** Plugins integrate directly with the SolidJS reactive state without dragging the whole editor down.

### ✨ Exact Features

- **Unified Command Palette (\`Ctrl+Shift+P\`):** A VS Code-style fuzzy finder that handles commands (\`>\`), workspace symbol search (\`#\`), file outline (\`@\`), and fast file switching—all unified into a single gorgeous dialog.
- **Intelligent Code Navigation:** Instant "Go to Definition" and intelligent symbol extraction powered by a custom Rust workspace indexer.
- **Multi-pane Editing:** Split your workspace vertically or horizontally. Drag and drop tabs effortlessly between panes.
- **Advanced CodeMirror 6 Engine:** Full syntax highlighting, error diagnostics, bracket matching, autocomplete, and seamless smooth scrolling.
- **Integrated Terminal:** A fast, resizable terminal built right into the bottom panel. Run your builds, tests, and scripts without ever leaving Rune.
- **Instant Workspace Search (\`Ctrl+Shift+F\`):** Deep text search across your entire codebase, returning results in milliseconds.
- **Responsive Keyboard Control:** Every action is keyboard accessible, with custom combo mapping and collision prevention.
- **Rich Media Viewing:** Built-in support for viewing images and PDFs directly within editor tabs.
- **Markdown Split Preview:** Live preview markdown files side-by-side with your code.

### The Stack

- **Frontend Interface:** SolidJS & TypeScript
- **Backend Runtime:** Tauri & Rust
- **Editing Engine:** CodeMirror 6
- **Design System:** Vanilla CSS & Tailwind

---
*Crafted with passion for developers who care about their tools.*
