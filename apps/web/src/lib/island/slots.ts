import { z } from 'zod';
import type { SlotMap } from './layout.js';

export const SLOTS_STORAGE_KEY = 'unpaidinterns.districts';

const slotsSchema = z.record(z.string(), z.number().int().nonnegative());

type ReadStorage = Pick<Storage, 'getItem'>;
type WriteStorage = Pick<Storage, 'setItem'>;

/** District positions are remembered so a project keeps its place on the island across visits. */
export function loadSlots(storage: ReadStorage): SlotMap {
  try {
    const parsed = slotsSchema.safeParse(JSON.parse(storage.getItem(SLOTS_STORAGE_KEY) ?? '{}'));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

export function saveSlots(storage: WriteStorage, slots: SlotMap): void {
  storage.setItem(SLOTS_STORAGE_KEY, JSON.stringify(slots));
}
