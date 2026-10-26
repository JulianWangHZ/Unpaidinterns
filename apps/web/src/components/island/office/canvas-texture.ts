import { useEffect, useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';

type Draw = (ctx: CanvasRenderingContext2D, width: number, height: number) => void;

/**
 * A texture drawn with the 2D canvas API. It redraws when `key` changes and once more after
 * web fonts finish loading, so text never sticks in a fallback font.
 */
export function useCanvasTexture(width: number, height: number, draw: Draw, key: string): CanvasTexture {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const created = new CanvasTexture(canvas);
    created.colorSpace = SRGBColorSpace;
    created.anisotropy = 4;
    return created;
  }, [width, height]);

  useEffect(() => {
    const paint = () => {
      const canvas = texture.image as HTMLCanvasElement;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      draw(ctx, width, height);
      texture.needsUpdate = true;
    };
    paint();
    let cancelled = false;
    void document.fonts?.ready.then(() => {
      if (!cancelled) paint();
    });
    return () => {
      cancelled = true;
    };
    // `key` captures everything `draw` reads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texture, key]);

  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}
