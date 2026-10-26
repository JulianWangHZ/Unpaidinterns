/**
 * A stand-in for the browser canvas so texture code can run under Node.
 * Every 2D context call is recorded; nothing is actually drawn.
 */
export interface FakeCanvas {
  width: number;
  height: number;
  calls: string[];
  getContext(kind: string): unknown;
}

export function installFakeCanvas(): { canvases: FakeCanvas[]; restore(): void } {
  const canvases: FakeCanvas[] = [];
  const previous = (globalThis as { document?: unknown }).document;

  const createCanvas = (): FakeCanvas => {
    const calls: string[] = [];
    const ctx: Record<string, unknown> = new Proxy(
      {},
      {
        get(target: Record<string, unknown>, key: string) {
          if (key in target) return target[key];
          if (key === 'createLinearGradient') return () => ({ addColorStop: () => calls.push('addColorStop') });
          if (key === 'measureText') return (text: string) => ({ width: text.length * 10 });
          return (...args: unknown[]) => {
            calls.push(key);
            return args.length;
          };
        },
        set(target: Record<string, unknown>, key: string, value: unknown) {
          target[key] = value;
          calls.push(`set:${key}`);
          return true;
        },
      },
    );
    const canvas: FakeCanvas = { width: 0, height: 0, calls, getContext: () => ctx };
    canvases.push(canvas);
    return canvas;
  };

  (globalThis as { document?: unknown }).document = {
    createElement: (tag: string) => {
      if (tag !== 'canvas') throw new Error(`fake document only creates canvas, got ${tag}`);
      return createCanvas();
    },
  };

  return {
    canvases,
    restore: () => {
      (globalThis as { document?: unknown }).document = previous;
    },
  };
}
