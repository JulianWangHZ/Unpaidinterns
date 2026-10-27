import type { SceneDefinition } from './types.js';

const LANES = 6;

/** Swimmers hold a lane each across the pool; the deck around it holds the activities. */
export const pool: SceneDefinition = {
  id: 'pool',
  seatAt: (index) => ({
    position: [-6.2 + (index % LANES) * 1.05, -0.15, -1.6 + Math.floor(index / LANES) * 1.6],
    facing: 0,
  }),
  activities: {
    coffee: [3.4, 0, -4.2],
    kitchen: [6.4, 0, -4.2],
    ktv: [6.8, 0, -0.6],
    gym: [6.6, 0, 2.8],
    massage: [3.6, 0, 4.4],
    ballpit: [3.2, 0, 1],
    pingpong: [0.4, 0, 4.6],
    sofa: [0.4, 0, -3.2],
    nap: [-0.6, 0, -4.4],
  },
  outfits: {
    working: { body: null, headwear: 'swimcap', headwearColor: '#ffffff', extra: 'none' },
    needsYou: { body: '#ff5d5d', headwear: 'cap', headwearColor: '#ff5d5d', extra: 'whistle' },
    resting: { body: null, headwear: 'none', headwearColor: '#000000', extra: 'none' },
    trouble: { body: null, headwear: 'swimcap', headwearColor: '#ffffff', extra: 'floatRing' },
  },
  characterScale: 1,
  nameTags: false,
  cameraTarget: [0, 1, 0.4],
  closeOffset: [4.5, 5.5, 6],
  cameraOffset: [15, 6, 20],
};
