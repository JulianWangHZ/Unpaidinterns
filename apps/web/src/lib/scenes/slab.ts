export interface Rect {
  x1: number;
  x2: number;
  z1: number;
  z2: number;
}

/** Splits a floor rectangle into pieces that leave every hole open. */
export function slabAroundAll(full: Rect, holes: readonly Rect[]): Rect[] {
  return holes.reduce<Rect[]>((pieces, hole) => pieces.flatMap((piece) => slabAround(piece, hole)), [full]);
}

/** Splits a floor rectangle into up to four pieces that surround a hole, so the hole is truly open. */
export function slabAround(full: Rect, hole: Rect | null): Rect[] {
  if (!hole) return [full];
  const h = {
    x1: Math.max(full.x1, hole.x1),
    x2: Math.min(full.x2, hole.x2),
    z1: Math.max(full.z1, hole.z1),
    z2: Math.min(full.z2, hole.z2),
  };
  if (h.x1 >= h.x2 || h.z1 >= h.z2) return [full];
  const pieces: Rect[] = [
    { x1: full.x1, x2: full.x2, z1: full.z1, z2: h.z1 },
    { x1: full.x1, x2: full.x2, z1: h.z2, z2: full.z2 },
    { x1: full.x1, x2: h.x1, z1: h.z1, z2: h.z2 },
    { x1: h.x2, x2: full.x2, z1: h.z1, z2: h.z2 },
  ];
  return pieces.filter((piece) => piece.x2 - piece.x1 > 1e-6 && piece.z2 - piece.z1 > 1e-6);
}
