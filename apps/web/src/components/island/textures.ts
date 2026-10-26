import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from 'three';
import { seeded } from '../../lib/scenes/skyline.js';

const cache = new Map<string, Texture>();

function canvasTexture(key: string, width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const cached = cache.get(key);
  if (cached) return cached;
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

/** A tileable facade: a 4 x 8 grid of windows, a few of them lit. Clone it per building to set repeat. */
export function windowTexture(): Texture {
  return canvasTexture('windows', 64, 128, (ctx) => {
    const random = seeded(11);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 64, 128);
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 4; col += 1) {
        const lit = random() < 0.22;
        ctx.fillStyle = lit ? '#fff1c9' : '#7f93bd';
        ctx.fillRect(col * 16 + 3, row * 16 + 4, 10, 9);
      }
    }
  });
}

export function facade(columns: number, rows: number): Texture {
  const texture = windowTexture().clone();
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(columns, rows);
  texture.needsUpdate = true;
  return texture;
}

/** Vertical sky gradient used as the scene background. */
export function skyTexture(top: string, bottom: string): Texture {
  return canvasTexture(`sky:${top}:${bottom}`, 2, 256, (ctx) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, top);
    gradient.addColorStop(1, bottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 256);
  });
}

/** Night facade: dark wall, a third of the windows lit warm. Use as both map and emissiveMap. */
export function nightFacade(columns: number, rows: number): Texture {
  const base = canvasTexture('night-windows', 64, 128, (ctx) => {
    const random = seeded(23);
    ctx.fillStyle = '#1d1a38';
    ctx.fillRect(0, 0, 64, 128);
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 4; col += 1) {
        const lit = random();
        ctx.fillStyle = lit < 0.3 ? '#ffd28a' : lit < 0.38 ? '#9fd8ff' : '#2c2a52';
        ctx.fillRect(col * 16 + 3, row * 16 + 4, 10, 9);
      }
    }
  });
  const texture = base.clone();
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(columns, rows);
  texture.needsUpdate = true;
  return texture;
}

/** The view through the office windows: a dusk sky over a lit skyline. */
export function cityViewTexture(seed: number): Texture {
  return canvasTexture(`city-view:${seed}`, 512, 160, (ctx) => {
    const random = seeded(seed);
    const sky = ctx.createLinearGradient(0, 0, 0, 160);
    sky.addColorStop(0, '#2a2056');
    sky.addColorStop(0.65, '#6b4f9a');
    sky.addColorStop(1, '#c48fb8');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 512, 160);
    for (let layer = 0; layer < 2; layer += 1) {
      let x = -10;
      while (x < 512) {
        const width = 18 + random() * 34;
        const height = (layer === 0 ? 40 : 70) + random() * (layer === 0 ? 60 : 70);
        ctx.fillStyle = layer === 0 ? '#3a3168' : '#231d45';
        ctx.fillRect(x, 160 - height, width, height);
        for (let wy = 160 - height + 6; wy < 156; wy += 7) {
          for (let wx = x + 3; wx < x + width - 4; wx += 6) {
            if (random() < 0.28) {
              ctx.fillStyle = random() < 0.8 ? '#ffd28a' : '#9fd8ff';
              ctx.fillRect(wx, wy, 3, 3);
            }
          }
        }
        x += width + 2 + random() * 6;
      }
    }
  });
}
