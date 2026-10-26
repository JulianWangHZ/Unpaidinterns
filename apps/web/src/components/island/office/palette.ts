import type { RoomId } from '../../../lib/scenes/office.js';

/** One accent per room: used for the rug, the floor-edge light strip and the room sign. */
export const ROOM_ACCENT: Readonly<Record<RoomId, string>> = {
  claude: '#f0936f',
  codex: '#3fc9a4',
  gemini: '#6f9dff',
  lounge: '#ff8fbf',
  rec: '#ffc26b',
};

export const WOOD = '#c99d76';
export const WOOD_DARK = '#9b7352';
export const WALL = '#efe3d3';
export const WALL_LOW = '#d9c2a6';
export const FRAME = '#2a2550';
