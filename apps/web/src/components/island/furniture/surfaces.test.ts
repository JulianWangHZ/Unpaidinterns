import { CanvasTexture, RepeatWrapping } from 'three';
import { afterAll, describe, expect, it } from 'vitest';
import { installFakeCanvas } from '../../../test/fake-canvas.js';

const fake = installFakeCanvas();
const surfaces = await import('./surfaces.js');
const screens = await import('./screens.js');

afterAll(() => fake.restore());

describe('surfaces', () => {
  it('draws brushed metal as separate colour and roughness maps', () => {
    const { map, roughnessMap } = surfaces.brushedMetal();
    expect(map).toBeInstanceOf(CanvasTexture);
    expect(roughnessMap).not.toBe(map);
    expect(map.wrapS).toBe(RepeatWrapping);
  });

  it.each([
    ['wood', () => surfaces.woodGrain()],
    ['felt', () => surfaces.felt('#1f7a52')],
    ['menu', () => surfaces.chalkMenu()],
    ['arcade', () => surfaces.arcadeScreen(3)],
  ])('draws %s onto a canvas', (_name, make) => {
    const before = fake.canvases.length;
    const texture = make();
    expect(texture).toBeInstanceOf(CanvasTexture);
    const canvas = fake.canvases.at(-1);
    expect(fake.canvases.length).toBe(before + 1);
    expect(canvas?.calls.length).toBeGreaterThan(5);
  });

  it('caches textures by key', () => {
    expect(surfaces.woodGrain()).toBe(surfaces.woodGrain());
    expect(surfaces.felt('#123456')).toBe(surfaces.felt('#123456'));
    expect(surfaces.felt('#123456')).not.toBe(surfaces.felt('#654321'));
  });

  it('draws different arcade games for different cabinets', () => {
    expect(surfaces.arcadeScreen(1)).not.toBe(surfaces.arcadeScreen(2));
  });
});

describe('screens', () => {
  it('draws a lock screen for an idle desk and code for a busy one', () => {
    const off = screens.screenTexture(null);
    const offCalls = fake.canvases.at(-1)?.calls.length ?? 0;
    const on = screens.screenTexture('#9be3c0');
    const onCalls = fake.canvases.at(-1)?.calls.length ?? 0;
    expect(on).not.toBe(off);
    expect(onCalls).toBeGreaterThan(offCalls);
  });

  it('reuses the same screen texture for the same state colour', () => {
    expect(screens.screenTexture('#bfe3ff')).toBe(screens.screenTexture('#bfe3ff'));
  });

  it('draws a keyboard once', () => {
    expect(screens.keyboardTexture()).toBe(screens.keyboardTexture());
  });
});

