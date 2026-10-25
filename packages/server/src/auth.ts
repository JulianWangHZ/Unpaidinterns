import { timingSafeEqual } from 'node:crypto';

export function tokensMatch(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** The printed link works once; after that the browser relies on its cookie. */
export function createLinkAuth(linkToken: string): { redeem(token: string): boolean } {
  let used = false;
  return {
    redeem(token) {
      if (used || !tokensMatch(token, linkToken)) return false;
      used = true;
      return true;
    },
  };
}
