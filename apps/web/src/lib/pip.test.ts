import { describe, expect, it } from 'vitest';
import { copyStyles, pipSupported } from './pip.js';

describe('pipSupported', () => {
  it('detects the Document Picture-in-Picture API', () => {
    expect(pipSupported({ documentPictureInPicture: {} })).toBe(true);
    expect(pipSupported({})).toBe(false);
  });
});

describe('copyStyles', () => {
  it('clones every style and stylesheet link into the target head', () => {
    const appended: unknown[] = [];
    const source = {
      querySelectorAll: () => [{ cloneNode: () => 'style-a' }, { cloneNode: () => 'link-b' }],
    };
    const target = { head: { append: (...nodes: unknown[]) => appended.push(...nodes) } };
    copyStyles(source, target);
    expect(appended).toEqual(['style-a', 'link-b']);
  });
});
