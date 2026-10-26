import { CanvasTexture, SRGBColorSpace, type Texture } from 'three';
import { seeded } from '../../../lib/scenes/skyline.js';

const cache = new Map<string, Texture>();

function make(key: string, width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void): Texture {
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) draw(ctx);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  cache.set(key, texture);
  return texture;
}

/** A code editor screen tinted by the agent's state colour. Idle screens show a dim lock screen. */
export function screenTexture(tint: string | null): Texture {
  return make(`screen:${tint ?? 'off'}`, 256, 150, (ctx) => {
    if (!tint) {
      ctx.fillStyle = '#1b1d2a';
      ctx.fillRect(0, 0, 256, 150);
      ctx.fillStyle = '#3a3d55';
      ctx.beginPath();
      ctx.arc(128, 70, 16, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    const random = seeded(tint.length * 97 + tint.charCodeAt(1));
    ctx.fillStyle = '#161826';
    ctx.fillRect(0, 0, 256, 150);
    ctx.fillStyle = '#222538';
    ctx.fillRect(0, 0, 46, 150);
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, 256, 10);
    const colours = [tint, '#c9b8f5', '#9fd8ff', '#f5f0e6', '#ffd28a'];
    for (let line = 0; line < 13; line += 1) {
      let x = 56 + Math.floor(random() * 3) * 10;
      const y = 18 + line * 10;
      ctx.fillStyle = '#3a3d55';
      ctx.fillRect(8, y, 24 + random() * 10, 4);
      const words = 1 + Math.floor(random() * 4);
      for (let word = 0; word < words && x < 240; word += 1) {
        const width = 12 + random() * 40;
        ctx.fillStyle = colours[Math.floor(random() * colours.length)] as string;
        ctx.fillRect(x, y, Math.min(width, 246 - x), 5);
        x += width + 6;
      }
    }
  });
}

/** Keycaps for a full-size keyboard, seen from above. */
export function keyboardTexture(): Texture {
  return make('keyboard', 256, 80, (ctx) => {
    ctx.fillStyle = '#e8e9f2';
    ctx.fillRect(0, 0, 256, 80);
    ctx.fillStyle = '#ffffff';
    for (let row = 0; row < 5; row += 1) {
      for (let col = 0; col < 16; col += 1) {
        ctx.fillRect(4 + col * 15.6, 4 + row * 15, 13, 12);
      }
    }
    ctx.fillRect(60, 64, 130, 12);
  });
}
