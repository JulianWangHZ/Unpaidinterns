import { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, Matrix4, type InstancedMesh } from 'three';
import type { Tile } from '../../lib/island/layout.js';
import { HEX_SIZE, tileCentre } from '../../lib/island/positions.js';

const TILE_HEIGHT = 0.28;
const GAP = 0.94;

/** Every hex tile in one instanced mesh, so the floor is a single draw call. */
export function Tiles({ tiles }: { tiles: Tile[] }) {
  const mesh = useRef<InstancedMesh>(null);
  const count = tiles.length;

  useLayoutEffect(() => {
    const target = mesh.current;
    if (!target) return;
    const matrix = new Matrix4();
    const color = new Color();
    tiles.forEach((tile, index) => {
      const [x, , z] = tileCentre(tile.hex);
      matrix.makeTranslation(x, -TILE_HEIGHT / 2, z);
      target.setMatrixAt(index, matrix);
      target.setColorAt(index, color.set(tile.color));
    });
    target.instanceMatrix.needsUpdate = true;
    if (target.instanceColor) target.instanceColor.needsUpdate = true;
  }, [tiles]);

  const radius = useMemo(() => HEX_SIZE * GAP, []);

  return (
    <instancedMesh key={count} ref={mesh} args={[undefined, undefined, count]} receiveShadow>
      <cylinderGeometry args={[radius, radius, TILE_HEIGHT, 6]} />
      <meshStandardMaterial roughness={0.85} />
    </instancedMesh>
  );
}

/** The thick slab under the tiles that makes the island read as a floating diorama. */
export function IslandBase({ radius }: { radius: number }) {
  const size = (radius + 0.75) * HEX_SIZE * Math.sqrt(3);
  return (
    <group>
      <mesh position={[0, -TILE_HEIGHT - 0.35, 0]} rotation={[0, Math.PI / 6, 0]} receiveShadow>
        <cylinderGeometry args={[size, size * 0.92, 0.7, 6]} />
        <meshStandardMaterial color="#d6dbf5" roughness={0.9} />
      </mesh>
      <mesh position={[0, -TILE_HEIGHT - 1.05, 0]} rotation={[0, Math.PI / 6, 0]}>
        <cylinderGeometry args={[size * 0.92, size * 0.55, 0.7, 6]} />
        <meshStandardMaterial color="#c3c9ee" roughness={0.9} />
      </mesh>
    </group>
  );
}
