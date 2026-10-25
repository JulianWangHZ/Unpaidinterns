import { describe, expect, it } from 'vitest';
import { createLinkAuth, tokensMatch } from '../src/auth.js';

describe('tokensMatch', () => {
  it('matches equal tokens', () => {
    expect(tokensMatch('abc', 'abc')).toBe(true);
  });

  it('rejects different tokens of the same length', () => {
    expect(tokensMatch('abc', 'abd')).toBe(false);
  });

  it('rejects tokens of different length', () => {
    expect(tokensMatch('abc', 'abcd')).toBe(false);
  });
});

describe('createLinkAuth', () => {
  it('redeems the link token only once', () => {
    const auth = createLinkAuth('link');
    expect(auth.redeem('wrong')).toBe(false);
    expect(auth.redeem('link')).toBe(true);
    expect(auth.redeem('link')).toBe(false);
  });
});
