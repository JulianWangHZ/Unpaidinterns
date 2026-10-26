import type { SceneDefinition } from './types.js';

/** Ride booths stand in an arc on the left; staff work the booths facing visitors. */
export const park: SceneDefinition = {
  id: 'park',
  seatAt: (index) => {
    const ring = Math.floor(index / 6);
    const angle = Math.PI * (0.62 + (index % 6) * 0.15) + ring * 0.07;
    const radius = 6 + ring * 2;
    return {
      position: [Math.cos(angle) * radius + 1, 0, Math.sin(angle) * radius * 0.8],
      facing: Math.atan2(-Math.cos(angle), -Math.sin(angle)),
    };
  },
  activities: {
    coffee: [1.2, 0, -1.4],
    kitchen: [3.6, 0, -3.6],
    ktv: [5.2, 0, 0.6],
    gym: [2.2, 0, 3.4],
    massage: [5.6, 0, 3.6],
    ballpit: [-0.6, 0, 1.6],
    pingpong: [3.4, 0, 1.2],
    sofa: [4.6, 0, -1.6],
    nap: [7.2, 0, -2.6],
  },
  outfits: {
    working: { body: null, headwear: 'cap', headwearColor: '#ff5d8f', extra: 'none' },
    needsYou: { body: '#c9a27a', headwear: 'mascot', headwearColor: '#c9a27a', extra: 'none' },
    resting: { body: null, headwear: 'none', headwearColor: '#000000', extra: 'balloon' },
    trouble: { body: '#ffe08a', headwear: 'none', headwearColor: '#000000', extra: 'clownNose' },
  },
  lighting: 'day',
  characterScale: 1,
  nameTags: false,
  cameraTarget: [1, 1.2, 0.4],
  closeOffset: [4.5, 5.5, 6],
  cameraOffset: [16, 6.5, 21],
};
