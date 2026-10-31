import { hash } from '../../textures/relief.js';
import { BIOMES, biomeWeights, dominant, groundHeight, type Biome } from './biomes.js';
import { BLOCKS, type BlockId } from './blocks.js';
import { BLOCK, CAMPFIRE, DOCK, FARM, flatDistance, HOUSE_SIZE, HOUSES, houseRect, inRect, LAMPS, PATH_WIDTH, PATHS, SEA_LEVEL, segmentDistance, WELL, WORKSHOP_FLOOR, WORKSHOP_YARD, WORLD } from './layout.js';
import { fbm } from './noise.js';
import { voxel } from '../voxel.js';

/**
 * A block world: a box of block ids, one byte each. Level `l` is the block whose top face is at
 * height `l * BLOCK`, so the village ground, level 0, is flush with the scene floor.
 */
export interface World {
  width: number;
  depth: number;
  bottom: number;
  top: number;
  blocks: Uint8Array;
  /** Top solid level of each column, row by row along x. */
  surface: Int16Array;
  biome: Biome[];
  /** Grass and leaf colour of each column, as three 0..1 multipliers, blended across biome borders. */
  tint: Float32Array;
}

/** Grass colour by biome: lush on the plains, cool in the taiga, dry and yellow near the desert. */
const TINTS: Readonly<Record<Biome, readonly [number, number, number]>> = {
  plains: [1, 1, 1],
  forest: [0.86, 0.97, 0.82],
  taiga: [0.7, 0.86, 0.8],
  mountains: [0.78, 0.9, 0.85],
  desert: [1, 0.95, 0.66],
  mesa: [1, 0.9, 0.62],
  ocean: [0.88, 1, 0.92],
};

export function columnX(i: number): number {
  return (i - WORLD.width / 2 + 0.5) * BLOCK;
}

export function columnZ(k: number): number {
  return (k - WORLD.depth / 2 + 0.5) * BLOCK;
}

/** The column under a point in scene units, as [i, k]. */
export function columnAt(x: number, z: number): [number, number] {
  return [Math.floor(x / BLOCK + WORLD.width / 2), Math.floor(z / BLOCK + WORLD.depth / 2)];
}

function indexOf(world: World, i: number, level: number, k: number): number {
  return ((level - world.bottom) * world.depth + k) * world.width + i;
}

/**
 * Height of the highest thing in the column under a point, trees included, in scene units.
 * Points off the world read as sea level.
 */
export function topAt(world: World, x: number, z: number): number {
  const [i, k] = columnAt(x, z);
  if (i < 0 || k < 0 || i >= world.width || k >= world.depth) return SEA_LEVEL * BLOCK;
  for (let level = world.top - 1; level > world.bottom; level -= 1) {
    if (blockAt(world, i, level, k) !== BLOCKS.air) return level * BLOCK;
  }
  return world.bottom * BLOCK;
}

/** Height of the ground under a point, in scene units: where an animal's feet go. */
export function groundAt(world: World, x: number, z: number): number {
  const [i, k] = columnAt(x, z);
  if (i < 0 || k < 0 || i >= world.width || k >= world.depth) return 0;
  return (world.surface[k * world.width + i] as number) * BLOCK;
}

export function blockAt(world: World, i: number, level: number, k: number): number {
  if (i < 0 || k < 0 || i >= world.width || k >= world.depth || level < world.bottom || level >= world.top) return BLOCKS.air;
  return world.blocks[indexOf(world, i, level, k)] as number;
}

function put(world: World, i: number, level: number, k: number, id: BlockId) {
  if (i < 0 || k < 0 || i >= world.width || k >= world.depth || level < world.bottom || level >= world.top) return;
  world.blocks[indexOf(world, i, level, k)] = id;
}

/** Layered colours of mesa cliffs, by height. */
const MESA_BANDS: readonly BlockId[] = [
  BLOCKS.clayOrange,
  BLOCKS.clayOrange,
  BLOCKS.clayCream,
  BLOCKS.clayRed,
  BLOCKS.clayOrange,
  BLOCKS.clayBrown,
  BLOCKS.clayCream,
  BLOCKS.clayRed,
];

const SNOW_LINE = 17;

/** What a column is built from: its top block, the few under it, and what is deep below. */
function layers(biome: Biome, height: number, x: number, z: number, seed: number, flat: boolean): { top: BlockId; under: BlockId; depth: number } {
  // The village is lawn right down to the shore; sand starts where the ground falls away.
  const beach = !flat && height <= SEA_LEVEL + 1 && height >= SEA_LEVEL - 3;
  if (biome === 'desert') return { top: BLOCKS.sand, under: BLOCKS.sandstone, depth: 4 };
  if (biome === 'mesa') return { top: BLOCKS.clayOrange, under: BLOCKS.clayOrange, depth: 0 };
  if (height < SEA_LEVEL - 3) return { top: fbm(x / 4, z / 4, seed + 11, 2) > 0.55 ? BLOCKS.gravel : BLOCKS.sand, under: BLOCKS.sand, depth: 2 };
  if (beach) return { top: BLOCKS.sand, under: BLOCKS.sand, depth: 3 };
  const snowLine = SNOW_LINE + (fbm(x / 6, z / 6, seed + 13, 2) - 0.5) * 6;
  if ((biome === 'mountains' || biome === 'taiga') && height >= snowLine) return { top: BLOCKS.snow, under: BLOCKS.stone, depth: 1 };
  if (biome === 'mountains' && height > 9) return { top: BLOCKS.stone, under: BLOCKS.stone, depth: 0 };
  return { top: BLOCKS.grass, under: BLOCKS.dirt, depth: 3 };
}

/** The village floor: paths, the cobbled square round the well, the workshop decking and the farm. */
function villageTop(x: number, z: number): BlockId | null {
  if (Math.hypot(x - WELL.at[0], z - WELL.at[2]) < 1.5) return hash(Math.round(x * 2), Math.round(z * 2), 3) < 0.3 ? BLOCKS.mossyCobble : BLOCKS.cobble;
  if (Math.hypot(x - CAMPFIRE.at[0], z - CAMPFIRE.at[2]) < 1.2) return BLOCKS.gravel;
  if (inRect(x, z, WORKSHOP_FLOOR)) return BLOCKS.planks;
  if (inRect(x, z, FARM)) return BLOCKS.farmland;
  if (PATHS.some((path) => segmentDistance(x, z, path) < PATH_WIDTH / 2)) return BLOCKS.path;
  return null;
}

/** Space round every prop and workbench that must stay free of plants. */
const KEEP_CLEAR = 1.9;

function villageClear(x: number, z: number): boolean {
  if (villageTop(x, z) !== null || inRect(x, z, WORKSHOP_YARD) || HOUSES.some((h) => inRect(x, z, houseRect(h), 0.5))) return false;
  return Object.values(voxel.activities).every(([ax, , az]) => Math.hypot(x - ax, z - az) > KEEP_CLEAR) && !LAMPS.some(([lx, , lz]) => Math.hypot(x - lx, z - lz) < 0.6);
}

/** Deep rock: mostly stone, with veins of andesite and the odd ore, richer the deeper it goes. */
function rock(i: number, level: number, k: number, seed: number): BlockId {
  const roll = hash(i * 31 + level, k * 17 - level, seed + 43);
  if (roll < 0.022) return BLOCKS.coalOre;
  if (roll < 0.032) return BLOCKS.ironOre;
  if (roll < 0.036 && level < 6) return BLOCKS.goldOre;
  return fbm(i / 7 + level * 0.31, k / 7 - level * 0.17, seed + 41, 2) > 0.66 ? BLOCKS.andesite : BLOCKS.stone;
}

function blendTint(world: World, column: number, weights: Record<Biome, number> | null) {
  for (let c = 0; c < 3; c += 1) {
    world.tint[column * 3 + c] = weights ? BIOMES.reduce((sum, b) => sum + weights[b] * (TINTS[b][c] as number), 0) : (TINTS.plains[c] as number);
  }
}

function fillColumns(world: World, seed: number) {
  for (let k = 0; k < world.depth; k += 1) {
    for (let i = 0; i < world.width; i += 1) {
      const x = columnX(i);
      const z = columnZ(k);
      const flat = flatDistance(x, z) === 0;
      const weights = flat ? null : biomeWeights(x, z, seed);
      const biome = weights ? dominant(weights) : 'plains';
      blendTint(world, k * world.width + i, weights);
      const height = Math.min(world.top - 12, Math.max(world.bottom + 2, groundHeight(x, z, seed)));
      const { top, under, depth } = layers(biome, height, x, z, seed, flat);
      world.surface[k * world.width + i] = height;
      world.biome[k * world.width + i] = biome;
      for (let level = world.bottom; level <= height; level += 1) {
        const below = height - level;
        let id: BlockId = below === 0 ? top : below <= depth ? under : BLOCKS.stone;
        // Only rock near the surface can ever show, so only that is worth dressing.
        if (id === BLOCKS.stone && below < 8) id = rock(i, level, k, seed);
        if (biome === 'mesa') id = MESA_BANDS[(((level + 64) % MESA_BANDS.length) + MESA_BANDS.length) % MESA_BANDS.length] as BlockId;
        if (flat && below === 0) id = villageTop(x, z) ?? id;
        put(world, i, level, k, id);
      }
      for (let level = height + 1; level <= SEA_LEVEL; level += 1) put(world, i, level, k, BLOCKS.water);
    }
  }
}

function oak(world: World, i: number, base: number, k: number, tall: number) {
  for (let y = 0; y < tall; y += 1) put(world, i, base + y, k, BLOCKS.oakLog);
  const crown = base + tall - 2;
  for (let dy = 0; dy <= 3; dy += 1) {
    const radius = dy < 2 ? 2 : 1;
    for (let dx = -radius; dx <= radius; dx += 1) {
      for (let dz = -radius; dz <= radius; dz += 1) {
        // Clip the corners so the crown reads round.
        if (Math.abs(dx) === radius && Math.abs(dz) === radius && (radius === 1 || dy === 1)) continue;
        if (blockAt(world, i + dx, crown + dy, k + dz) === BLOCKS.air) put(world, i + dx, crown + dy, k + dz, BLOCKS.oakLeaves);
      }
    }
  }
}

function spruce(world: World, i: number, base: number, k: number, tall: number) {
  for (let y = 0; y < tall; y += 1) put(world, i, base + y, k, BLOCKS.spruceLog);
  // Rings of needles that narrow towards the tip.
  for (let y = 2; y <= tall; y += 1) {
    const radius = y === tall ? 0 : (tall - y) % 2 === 0 ? 1 : 2;
    for (let dx = -radius; dx <= radius; dx += 1) {
      for (let dz = -radius; dz <= radius; dz += 1) {
        if (radius === 2 && Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;
        if (blockAt(world, i + dx, base + y, k + dz) === BLOCKS.air) put(world, i + dx, base + y, k + dz, BLOCKS.spruceLeaves);
      }
    }
  }
}

/** Chance per tree slot, and per plain column for small plants, by biome. */
const GROWTH: Readonly<Record<Biome, { tree: number; plants: ReadonlyArray<readonly [BlockId, number]> }>> = {
  plains: { tree: 0.12, plants: [[BLOCKS.tallGrass, 0.22], [BLOCKS.poppy, 0.03], [BLOCKS.dandelion, 0.04]] },
  forest: { tree: 0.75, plants: [[BLOCKS.tallGrass, 0.14], [BLOCKS.poppy, 0.02], [BLOCKS.dandelion, 0.02]] },
  taiga: { tree: 0.7, plants: [[BLOCKS.tallGrass, 0.06]] },
  mountains: { tree: 0.25, plants: [[BLOCKS.tallGrass, 0.04]] },
  desert: { tree: 0.22, plants: [[BLOCKS.deadBush, 0.015]] },
  mesa: { tree: 0, plants: [[BLOCKS.deadBush, 0.01]] },
  ocean: { tree: 0, plants: [] },
};

/** Trees grow at most one per slot of this many blocks square, so crowns never merge into a wall. */
const SLOT = 5;
const EDGE = 3;

function grow(world: World, seed: number) {
  for (let k = EDGE; k < world.depth - EDGE; k += 1) {
    for (let i = EDGE; i < world.width - EDGE; i += 1) {
      const column = k * world.width + i;
      const height = world.surface[column] as number;
      const biome = world.biome[column] as Biome;
      const top = blockAt(world, i, height, k);
      const x = columnX(i);
      const z = columnZ(k);
      if (height <= SEA_LEVEL) continue;
      if (flatDistance(x, z) < 1.5) {
        // Only the odd tuft on open village lawn, clear of props, benches and paths.
        if (top === BLOCKS.grass && villageClear(x, z) && hash(i, k, seed + 31) < 0.06) put(world, i, height + 1, k, hash(i, k, seed + 37) < 0.7 ? BLOCKS.tallGrass : BLOCKS.dandelion);
        continue;
      }
      const slotI = Math.floor(i / SLOT);
      const slotK = Math.floor(k / SLOT);
      const pick = Math.floor(hash(slotI, slotK, seed + 17) * SLOT * SLOT);
      const inSlot = i % SLOT === pick % SLOT && k % SLOT === Math.floor(pick / SLOT);
      const growth = GROWTH[biome];
      if (inSlot && hash(slotI, slotK, seed + 19) < growth.tree) {
        const tall = 4 + Math.floor(hash(i, k, seed + 23) * 3);
        if (biome === 'desert' && top === BLOCKS.sand) for (let y = 1; y <= tall - 2; y += 1) put(world, i, height + y, k, BLOCKS.cactus);
        else if (top === BLOCKS.grass && (biome === 'taiga' || biome === 'mountains')) spruce(world, i, height + 1, k, tall + 2);
        else if (top === BLOCKS.grass) oak(world, i, height + 1, k, tall);
        continue;
      }
      let roll = hash(i, k, seed + 29);
      for (const [plant, chance] of growth.plants) {
        const fits = plant === BLOCKS.deadBush ? top === BLOCKS.sand || top === BLOCKS.clayOrange : top === BLOCKS.grass;
        if (roll < chance && fits && blockAt(world, i, height + 1, k) === BLOCKS.air) {
          put(world, i, height + 1, k, plant);
          break;
        }
        roll -= chance;
      }
    }
  }
}

/** Ripe wheat in every farm row but the middle one, which carries water down the field. */
function farm(world: World) {
  for (let k = 0; k < world.depth; k += 1) {
    for (let i = 0; i < world.width; i += 1) {
      if (!inRect(columnX(i), columnZ(k), FARM)) continue;
      const middle = Math.abs(columnZ(k) - (FARM.z1 + FARM.z2) / 2) < BLOCK / 2;
      if (middle) put(world, i, 0, k, BLOCKS.water);
      else put(world, i, 1, k, BLOCKS.wheat);
    }
  }
}

/** Planks out over the sea at village level, on log piles that reach down to the sea bed. */
function dock(world: World) {
  for (let k = 0; k < world.depth; k += 1) {
    for (let i = 0; i < world.width; i += 1) {
      const x = columnX(i);
      const z = columnZ(k);
      if (Math.abs(x - DOCK.x) > DOCK.width / 2 || z < DOCK.z1 || z > DOCK.z2) continue;
      put(world, i, 0, k, BLOCKS.planks);
      for (let level = 1; level < 4; level += 1) put(world, i, level, k, BLOCKS.air);
      const edge = Math.abs(x - DOCK.x) > DOCK.width / 2 - BLOCK;
      if (!edge || k % 3 !== 0) continue;
      for (let level = -1; level > world.bottom && [BLOCKS.water, BLOCKS.air, BLOCKS.sand].includes(blockAt(world, i, level, k) as never); level -= 1) {
        put(world, i, level, k, BLOCKS.oakLog);
      }
    }
  }
}

/**
 * A plank house on a cobble footing: log corners, glass windows, a door at the front and a
 * stepped gable roof that runs front to back.
 */
function house(world: World, i0: number, k0: number) {
  const { width: w, depth: d } = HOUSE_SIZE;
  const mid = Math.floor(w / 2);
  for (let dk = 0; dk < d; dk += 1) {
    for (let di = 0; di < w; di += 1) {
      const i = i0 + di;
      const k = k0 + dk;
      put(world, i, 0, k, BLOCKS.cobble);
      const wall = di === 0 || dk === 0 || di === w - 1 || dk === d - 1;
      const corner = (di === 0 || di === w - 1) && (dk === 0 || dk === d - 1);
      for (let level = 1; level <= 3; level += 1) {
        let id: BlockId = BLOCKS.air;
        if (corner) id = BLOCKS.oakLog;
        else if (wall) {
          id = BLOCKS.planks;
          const window = level === 2 && (dk === d - 1 ? Math.abs(di - mid) === 1 : di === mid || dk === Math.floor(d / 2));
          if (window) id = BLOCKS.glass;
          if (dk === d - 1 && di === mid && level < 3) id = level === 1 ? BLOCKS.doorLower : BLOCKS.doorUpper;
        }
        put(world, i, level, k, id);
      }
    }
  }
  // Each step of the roof comes in one block from both sides, and the gable ends fill the triangle under it.
  for (let step = 0; step * 2 <= w + 1; step += 1) {
    const level = 4 + step;
    const left = -1 + step;
    const right = w - step;
    for (let dk = -1; dk <= d; dk += 1) {
      put(world, i0 + left, level, k0 + dk, BLOCKS.sprucePlanks);
      put(world, i0 + right, level, k0 + dk, BLOCKS.sprucePlanks);
    }
    for (let di = left + 1; di < right; di += 1) {
      for (const dk of [0, d - 1]) put(world, i0 + di, level, k0 + dk, BLOCKS.planks);
      for (let dk = 1; dk < d - 1; dk += 1) put(world, i0 + di, level, k0 + dk, BLOCKS.air);
    }
  }
}

const cache = new Map<number, World>();

/** The whole world for a seed. Built once and shared: generating it takes a moment. */
export function generateWorld(seed = 7): World {
  const hit = cache.get(seed);
  if (hit) return hit;
  const columns = WORLD.width * WORLD.depth;
  const world: World = {
    width: WORLD.width,
    depth: WORLD.depth,
    bottom: WORLD.bottom,
    top: WORLD.top,
    blocks: new Uint8Array(columns * (WORLD.top - WORLD.bottom)),
    surface: new Int16Array(columns),
    biome: new Array<Biome>(columns),
    tint: new Float32Array(columns * 3),
  };
  fillColumns(world, seed);
  grow(world, seed);
  farm(world);
  dock(world);
  for (const [x, , z] of HOUSES) house(world, ...columnAt(x + BLOCK / 2, z + BLOCK / 2));
  cache.set(seed, world);
  return world;
}
