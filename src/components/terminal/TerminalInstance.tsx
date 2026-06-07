import "xterm/css/xterm.css";
import { useTerminalInstance } from "@/hooks/useTerminalInstance";

interface TerminalInstanceProps {
  id: string;
  rootPath: string | null;
  isActive: boolean;
  onExit: (id: string) => void;
}

export function TerminalInstance(props: TerminalInstanceProps) {
  const { setTerminalRef, focus } = useTerminalInstance(
    props.id,
    props.rootPath,
    () => props.isActive,
    props.onExit,
  );

  return (
    <div
      ref={setTerminalRef}
      class="absolute inset-0"
      onClick={focus}
      style={{
        // No padding — xterm manages its own internal spacing.
        // Padding breaks the canvas/cell alignment causing garbled text.
        visibility: props.isActive ? "visible" : "hidden",
        "pointer-events": props.isActive ? "auto" : "none",
      }}
    />
  );
}
