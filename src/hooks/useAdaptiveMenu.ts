import { createSignal, createEffect, Accessor } from "solid-js";

interface AdaptivePosition {
  x: number;
  y: number;
  maxHeight: number;
  ready: boolean;
}

/**
 * Custom hook that computes adaptive x/y/maxHeight for a popup menu
 * so it never overflows the viewport edges.
 *
 * Strategy:
 *  1. Initially render the menu off-screen (invisible) so the browser
 *     lays it out at its natural width/height.
 *  2. After a single rAF, read the natural bounding rect.
 *  3. Compute adjusted x, y, and maxHeight.
 *  4. Set `ready = true` so the component can flip opacity to 1.
 */
export function useAdaptiveMenu(
  x: Accessor<number>,
  y: Accessor<number>,
  menuRef: Accessor<HTMLElement | undefined>,
) {
  const [position, setPosition] = createSignal<AdaptivePosition>({
    x: -9999,
    y: -9999,
    maxHeight: 9999,
    ready: false,
  });

  createEffect(() => {
    const el = menuRef();
    const anchorX = x();
    const anchorY = y();

    if (!el) return;

    // Step 1: park the menu off-screen with no height constraint
    // so the browser gives us its natural dimensions.
    setPosition({ x: -9999, y: -9999, maxHeight: 9999, ready: false });

    requestAnimationFrame(() => {
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const menuW = rect.width;
      const menuH = rect.height;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const pad = 8;

      // --- X axis ---
      let finalX = anchorX;
      if (finalX + menuW > vw - pad) {
        finalX = anchorX - menuW;
      }
      if (finalX < pad) finalX = pad;

      // --- Y axis ---
      const spaceBelow = vh - anchorY - pad;
      const spaceAbove = anchorY - pad;

      let finalY: number;
      let maxH: number;

      if (menuH <= spaceBelow) {
        // Fits below the cursor
        finalY = anchorY;
        maxH = spaceBelow;
      } else if (menuH <= spaceAbove) {
        // Fits above the cursor
        finalY = anchorY - menuH;
        maxH = spaceAbove;
      } else if (spaceBelow >= spaceAbove) {
        // Neither fits perfectly – use the bigger space (below)
        finalY = anchorY;
        maxH = spaceBelow;
      } else {
        // Use the bigger space (above), pin to top
        finalY = pad;
        maxH = spaceAbove;
      }

      if (finalY < pad) finalY = pad;

      setPosition({ x: finalX, y: finalY, maxHeight: maxH, ready: true });
    });
  });

  return position;
}
