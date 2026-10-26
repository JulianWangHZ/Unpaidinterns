export const MALE_HAIR = ['short', 'spiky', 'buzz', 'cap'] as const;
export const FEMALE_HAIR = ['bob', 'long', 'ponytail', 'bun'] as const;
export const HAIR_STYLES = [...MALE_HAIR, ...FEMALE_HAIR] as const;
export type HairStyle = (typeof HAIR_STYLES)[number];
export type Gender = 'male' | 'female';

export interface Look {
  gender: Gender;
  skin: string;
  hair: HairStyle;
  hairColor: string;
  pants: string;
  shoes: string;
  /** Some characters wear glasses. */
  glasses: boolean;
  /** Some women wear a skirt instead of trousers. */
  skirt: boolean;
}

const SKINS = ['#f6d5b8', '#efc29b', '#d9a47a', '#b97f57', '#8d5a3b', '#ffe0c7'];
const HAIR_COLOURS = ['#2b1d16', '#4a2f22', '#7a4a2c', '#c08a4a', '#e8c27a', '#1d1d2b', '#a33b2f', '#6b6b78'];
const PANTS = ['#2f3a5a', '#3b3b46', '#5a4636', '#2c4b4f', '#6b5a8a', '#1f2430'];
const SKIRTS = ['#2f3a5a', '#8a3b5a', '#3b3b46', '#c08a4a', '#2c4b4f'];
const SHOES = ['#1b1b22', '#f1f1f4', '#7a4a2c', '#c0392b'];

function hash(text: string): number {
  let value = 2166136261;
  for (let i = 0; i < text.length; i += 1) value = Math.imul(value ^ text.charCodeAt(i), 16777619);
  // Final avalanche so neighbouring ids do not share low bits.
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d);
  value ^= value >>> 15;
  return value >>> 0;
}

function pick<T>(list: readonly T[], seed: number, salt: number): T {
  return list[Math.floor(seed / salt) % list.length] as T;
}

/** A stable look for one agent, so the same session always looks like the same person. */
export function lookFor(sessionId: string): Look {
  const seed = hash(sessionId);
  const gender: Gender = seed % 2 === 0 ? 'female' : 'male';
  const skirt = gender === 'female' && Math.floor(seed / 5003) % 3 === 0;
  return {
    gender,
    skin: pick(SKINS, seed, 3),
    hair: pick(gender === 'female' ? FEMALE_HAIR : MALE_HAIR, seed, 7),
    hairColor: pick(HAIR_COLOURS, seed, 41),
    pants: pick(skirt ? SKIRTS : PANTS, seed, 331),
    shoes: pick(SHOES, seed, 2311),
    glasses: Math.floor(seed / 17_011) % 4 === 0,
    skirt,
  };
}

/** Lighten (positive) or darken (negative) a #rrggbb colour by a fraction. */
export function shade(hex: string, amount: number): string {
  const channel = (offset: number) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16);
    const next = amount >= 0 ? value + (255 - value) * amount : value * (1 + amount);
    return Math.round(Math.min(255, Math.max(0, next))).toString(16).padStart(2, '0');
  };
  return `#${channel(1)}${channel(3)}${channel(5)}`;
}
