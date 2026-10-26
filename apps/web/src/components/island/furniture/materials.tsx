/** Material presets so every prop shares the same wood, metal and plastic look. */
export const WOOD_TOP = '#d2a77d';
export const WOOD_EDGE = '#a97c56';
export const METAL = '#a7afc4';
export const PLASTIC_DARK = '#2b2d3a';
export const FABRIC = '#4f8f9c';

export function Metal({ color = METAL }: { color?: string }) {
  return <meshStandardMaterial color={color} metalness={0.65} roughness={0.32} />;
}

export function Wood({ color = WOOD_TOP }: { color?: string }) {
  return <meshStandardMaterial color={color} roughness={0.62} />;
}

export function Plastic({ color = PLASTIC_DARK, gloss = false }: { color?: string; gloss?: boolean }) {
  return <meshStandardMaterial color={color} roughness={gloss ? 0.25 : 0.55} />;
}

export function Fabric({ color = FABRIC }: { color?: string }) {
  return <meshStandardMaterial color={color} roughness={0.95} />;
}
