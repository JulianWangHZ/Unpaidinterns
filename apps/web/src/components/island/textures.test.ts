import { CanvasTexture } from 'three';
import { afterAll, describe, expect, it } from 'vitest';
import { installFakeCanvas } from '../../test/fake-canvas.js';

const fake = installFakeCanvas();
const textures = await import('./textures.js');

afterAll(() => fake.restore());

describe('textures', () => {
  it('repeats the day facade to fit a building', () => {
    const texture = textures.facade(3, 5);
    expect(texture.repeat.x).toBe(3);
    expect(texture.repeat.y).toBe(5);
  });

  it('gives each building its own repeat but shares the drawing', () => {
    const a = textures.facade(2, 2);
    const b = textures.facade(4, 4);
    expect(a).not.toBe(b);
    expect(a.image).toBe(b.image);
  });

  it('repeats the night facade to fit a building', () => {
    const texture = textures.nightFacade(2, 6);
    expect(texture).toBeInstanceOf(CanvasTexture);
    expect(texture.repeat.y).toBe(6);
  });

  it('caches the sky gradient per colour pair', () => {
    expect(textures.skyTexture('#000', '#fff')).toBe(textures.skyTexture('#000', '#fff'));
    expect(textures.skyTexture('#000', '#fff')).not.toBe(textures.skyTexture('#111', '#fff'));
  });

  it('draws a city view per seed', () => {
    const view = textures.cityViewTexture(7);
    expect(fake.canvases.at(-1)?.calls.length).toBeGreaterThan(20);
    expect(textures.cityViewTexture(7)).toBe(view);
  });
});
