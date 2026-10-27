const GAP = 16;
const MARGIN = 8;

type Point = { x: number; y: number };
type Size = { width: number; height: number };

/** Puts a floating card beside the pointer, flipping left or lifting up so it always stays on screen. */
export function placeTip(at: Point, size: Size, view: Size): { left: number; top: number } {
  let left = at.x + GAP;
  let top = at.y + GAP;
  if (left + size.width > view.width - MARGIN) left = at.x - size.width - GAP;
  if (top + size.height > view.height - MARGIN) top = view.height - size.height - MARGIN;
  return { left: Math.max(MARGIN, left), top: Math.max(MARGIN, top) };
}
