import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { BufferAttribute, BufferGeometry, type Material, type Vector3 } from 'three';
import { buildMeshes, type MeshData } from '../../../lib/scenes/voxel/mesh.js';
import { generateWorld } from '../../../lib/scenes/voxel/world.js';
import { Animals } from './Animals.js';
import { Villagers } from './Villagers.js';
import { plantMaterials, sightUniforms, terrainMaterials, waterMaterials, waterTexture } from './materials.js';
import { VillageLights } from './VillageProps.js';

type Time = 'day' | 'night';

function toGeometry(data: MeshData, shaded: boolean): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(data.positions, 3));
  geometry.setAttribute('normal', new BufferAttribute(data.normals, 3));
  geometry.setAttribute('uv', new BufferAttribute(data.uvs, 2));
  if (shaded) geometry.setAttribute('color', new BufferAttribute(data.colors, 3));
  geometry.setIndex(new BufferAttribute(data.indices, 1));
  for (const { start, count, material } of data.groups) geometry.addGroup(start, count, material);
  geometry.computeBoundingSphere();
  return geometry;
}

function Surface({ data, materials, shaded, shadows }: { data: MeshData; materials: Material[]; shaded: boolean; shadows: boolean }) {
  const geometry = useMemo(() => toGeometry(data, shaded), [data, shaded]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} material={materials} castShadow={shadows} receiveShadow={shadows} />;
}

/**
 * Each frame: drifts the water texture so the sea and the farm channel look like they are
 * moving, and tells the terrain where the camera is looking from, so hills in the way fade.
 */
function FrameUpdates() {
  useFrame(({ camera, controls }, delta) => {
    sightUniforms.uSightCamera.value.copy(camera.position);
    const target = (controls as { target?: Vector3 } | null)?.target;
    if (target) sightUniforms.uSightTarget.value.copy(target);
    const texture = waterTexture();
    texture.offset.y = (texture.offset.y + delta * 0.06) % 1;
    texture.offset.x = (texture.offset.x + delta * 0.02) % 1;
  });
  return null;
}

/** The block world round the village: built once from its seed, then drawn as three meshes. */
export function VoxelGrounds({ time }: { time: Time }) {
  const meshes = useMemo(() => buildMeshes(generateWorld()), []);
  return (
    <group>
      <Surface data={meshes.solid} materials={terrainMaterials()} shaded shadows />
      <Surface data={meshes.plants} materials={plantMaterials()} shaded shadows={false} />
      <Surface data={meshes.water} materials={waterMaterials()} shaded={false} shadows={false} />
      <VillageLights night={time === 'night'} />
      <Animals />
      <Villagers />
      <FrameUpdates />
    </group>
  );
}
