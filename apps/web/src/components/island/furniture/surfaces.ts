import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from 'three';
import { seeded } from '../../../lib/scenes/skyline.js';

const cache = new Map<string, Texture>();

function paint(key: string, width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void, colour = true) {
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) draw(ctx);
  const texture = new CanvasTexture(canvas);
  if (colour) texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  cache.set(key, texture);
  return texture;
}

/** Fine horizontal streaks, used as both colour and roughness so steel catches light unevenly. */
export function brushedMetal(): { map: Texture; roughnessMap: Texture } {
  const draw = (base: number, spread: number) => (ctx: CanvasRenderingContext2D) => {
    const random = seeded(base);
    ctx.fillStyle = `rgb(${base},${base},${base})`;
    ctx.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 260; i += 1) {
      const shade = base + (random() - 0.5) * spread;
      ctx.fillStyle = `rgba(${shade},${shade},${shade},0.55)`;
      ctx.fillRect(random() * 128 - 40, random() * 128, 40 + random() * 90, 1);
    }
  };
  return {
    map: paint('metal-map', 128, 128, draw(205, 60)),
    roughnessMap: paint('metal-rough', 128, 128, draw(110, 90), false),
  };
}

/** Wood with long grain lines and a few knots. */
export function woodGrain(): Texture {
  return paint('wood', 256, 64, (ctx) => {
    const random = seeded(19);
    ctx.fillStyle = '#c49468';
    ctx.fillRect(0, 0, 256, 64);
    for (let i = 0; i < 46; i += 1) {
      const y = random() * 64;
      ctx.strokeStyle = `rgba(${110 + random() * 40},${70 + random() * 25},${40 + random() * 20},0.35)`;
      ctx.lineWidth = 0.6 + random() * 1.4;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= 256; x += 32) ctx.lineTo(x, y + Math.sin(x / 40 + i) * 1.6);
      ctx.stroke();
    }
    for (let k = 0; k < 2; k += 1) {
      ctx.fillStyle = 'rgba(92,58,32,0.45)';
      ctx.beginPath();
      ctx.ellipse(40 + random() * 180, 10 + random() * 44, 6, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

/** Billiard cloth: flat green with a faint woven speckle. */
export function felt(color: string): Texture {
  return paint(`felt:${color}`, 64, 64, (ctx) => {
    const random = seeded(5);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 500; i += 1) {
      ctx.fillStyle = random() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
      ctx.fillRect(random() * 64, random() * 64, 1, 1);
    }
  });
}

/** A chalkboard menu with hand-drawn looking lines and prices. */
export function chalkMenu(): Texture {
  return paint('chalk-menu', 256, 160, (ctx) => {
    ctx.fillStyle = '#26302b';
    ctx.fillRect(0, 0, 256, 160);
    ctx.strokeStyle = '#8a6446';
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, 256, 160);
    ctx.fillStyle = '#f5efe0';
    ctx.font = '700 22px "IBM Plex Mono", monospace';
    ctx.fillText('COFFEE', 70, 36);
    ctx.font = '500 15px "IBM Plex Mono", monospace';
    const items = [['LATTE', '120'], ['FLAT WHITE', '110'], ['ESPRESSO', '80'], ['MATCHA', '130']];
    items.forEach(([name, price], i) => {
      ctx.fillStyle = '#f5efe0';
      ctx.fillText(name as string, 22, 66 + i * 22);
      ctx.fillStyle = '#ffd28a';
      ctx.fillText(price as string, 196, 66 + i * 22);
    });
  });
}

/** A frame of a pixel-art platform game for arcade screens. */
export function arcadeScreen(seed: number): Texture {
  return paint(`arcade:${seed}`, 96, 72, (ctx) => {
    const random = seeded(seed);
    const sky = ctx.createLinearGradient(0, 0, 0, 72);
    sky.addColorStop(0, seed % 2 ? '#1a1060' : '#0b2a4a');
    sky.addColorStop(1, seed % 2 ? '#5b2a8a' : '#1a6a8a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 96, 72);
    for (let i = 0; i < 24; i += 1) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.floor(random() * 96), Math.floor(random() * 40), 1, 1);
    }
    ctx.fillStyle = '#3fc96a';
    ctx.fillRect(0, 60, 96, 12);
    for (let x = 0; x < 96; x += 8) {
      ctx.fillStyle = '#2b8f4a';
      ctx.fillRect(x, 60, 4, 4);
    }
    for (let p = 0; p < 3; p += 1) {
      const px = 10 + p * 30 + Math.floor(random() * 6);
      const py = 32 + Math.floor(random() * 14);
      ctx.fillStyle = '#c96a3f';
      ctx.fillRect(px, py, 18, 4);
    }
    ctx.fillStyle = '#ff4d6a';
    ctx.fillRect(22, 50, 6, 10);
    ctx.fillStyle = '#ffe08a';
    for (let c = 0; c < 4; c += 1) ctx.fillRect(40 + c * 9, 26, 3, 3);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 8px monospace';
    ctx.fillText(`SCORE ${String(1000 + seed * 371).padStart(6, '0')}`, 4, 9);
  });
}
