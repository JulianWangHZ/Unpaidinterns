import { describe, expect, it } from 'vitest';
import en from './en.json';
import zhTW from './zh-TW.json';
import { pickLanguage } from './language.js';

function keys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) => keys(child, prefix ? `${prefix}.${key}` : key));
}

describe('translations', () => {
  it('has the same keys in every language', () => {
    expect(keys(zhTW).sort()).toEqual(keys(en).sort());
  });

  it('has no empty strings', () => {
    for (const resource of [en, zhTW]) {
      expect(JSON.stringify(resource)).not.toContain('""');
    }
  });
});

describe('pickLanguage', () => {
  it('prefers a saved choice', () => {
    expect(pickLanguage('en', 'zh-TW')).toBe('en');
  });

  it('falls back to Chinese for any zh browser locale', () => {
    expect(pickLanguage(null, 'zh-HK')).toBe('zh-TW');
  });

  it('falls back to English otherwise', () => {
    expect(pickLanguage(null, 'fr-FR')).toBe('en');
    expect(pickLanguage('klingon', 'de')).toBe('en');
  });
});
