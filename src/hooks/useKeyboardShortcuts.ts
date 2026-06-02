import { onMount, onCleanup } from "solid-js";

type ShortcutHandler = () => void;

interface ChordShortcut {
  first: string[];
  second: string[];
  action: ShortcutHandler;
}

export function useKeyboardShortcuts(
  shortcuts: () => Record<string, ShortcutHandler>,
  chords?: () => ChordShortcut[],
) {
  let waitingForChord: { action: ShortcutHandler; timeout: ReturnType<typeof setTimeout> } | null = null;

  function buildCombo(e: KeyboardEvent): string {
    const parts: string[] = [];
    if (e.ctrlKey || e.metaKey) parts.push("ctrl");
    if (e.shiftKey) parts.push("shift");
    if (e.altKey) parts.push("alt");
    parts.push(e.code);
    return parts.join("+");
  }

  function matchChordKey(e: KeyboardEvent, pattern: string): boolean {
    const parts = pattern.split("+");
    const needsCtrl = parts.includes("ctrl");
    const needsShift = parts.includes("shift");
    const key = parts[parts.length - 1]!;

    if (needsCtrl && !(e.ctrlKey || e.metaKey)) return false;
    if (needsShift && !e.shiftKey) return false;
    return e.code === key;
  }

  function handleKeyDown(e: KeyboardEvent) {
    const target = e.target as HTMLElement;
    const tag = target?.tagName;
    const isEditable = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || 
                       target?.isContentEditable || target?.closest(".cm-editor") !== null;

    const combo = buildCombo(e);
    if (isEditable && !combo.includes("ctrl")) {
      return;
    }

    // Check if we're waiting for a chord second key
    if (waitingForChord) {
      const chordList = chords?.() ?? [];
      for (const chord of chordList) {
        if (chord.second.some((p) => matchChordKey(e, p))) {
          e.preventDefault();
          e.stopPropagation();
          clearTimeout(waitingForChord.timeout);
          waitingForChord.action();
          waitingForChord = null;
          return;
        }
      }
      // If it's not a chord second key but is a shortcut, handle normally
      // Otherwise clear the chord wait
      const map = shortcuts();
      if (map[combo]) {
        clearTimeout(waitingForChord.timeout);
        waitingForChord = null;
        e.preventDefault();
        e.stopPropagation();
        map[combo]();
        return;
      }
      // Not a chord or shortcut — clear waiting state
      clearTimeout(waitingForChord.timeout);
      waitingForChord = null;
      return;
    }

    // Check chord first keys
    const chordList = chords?.() ?? [];
    for (const chord of chordList) {
      if (chord.first.some((p) => matchChordKey(e, p))) {
        e.preventDefault();
        e.stopPropagation();
        const action = chord.action;
        const timeout = setTimeout(() => { waitingForChord = null; }, 2000);
        waitingForChord = { action, timeout };
        return;
      }
    }

    // Check single shortcuts
    const map = shortcuts();
    const handler = map[combo];
    if (handler) {
      e.preventDefault();
      e.stopPropagation();
      handler();
    }
  }

  onMount(() => {
    document.addEventListener("keydown", handleKeyDown, true);
  });

  onCleanup(() => {
    document.removeEventListener("keydown", handleKeyDown, true);
    if (waitingForChord) clearTimeout(waitingForChord.timeout);
  });
}
