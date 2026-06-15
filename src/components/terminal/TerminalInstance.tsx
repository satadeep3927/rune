import "xterm/css/xterm.css";
import { TerminalSurface } from "@/components/ui/TerminalSurface";
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
    <TerminalSurface
      terminalRef={setTerminalRef}
      active={props.isActive}
      onClick={focus}
    />
  );
}
