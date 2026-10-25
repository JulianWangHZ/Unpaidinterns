import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { Vec3 } from '../../lib/island/positions.js';

const OVERVIEW_OFFSET = new Vector3(0, 10, 8.5);
const CLOSE_OFFSET = new Vector3(0, 6.5, 5.5);

/** Orbit controls plus a short glide to whatever is focused. The user can still drag and zoom. */
export function CameraRig({ focus, radius, reducedMotion }: { focus: Vec3 | null; radius: number; reducedMotion: boolean }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const goal = useRef<{ target: Vector3; position: Vector3 } | null>(null);

  useEffect(() => {
    const target = focus ? new Vector3(...focus) : new Vector3(0, 0, 0);
    // Scale the overview with the island so the whole thing always fits.
    const zoom = focus ? CLOSE_OFFSET : OVERVIEW_OFFSET.clone().multiplyScalar(radius * 0.5);
    goal.current = { target, position: target.clone().add(zoom) };
  }, [focus, radius]);

  useFrame((_, delta) => {
    const orbit = controls.current;
    const next = goal.current;
    if (!orbit || !next) return;
    const step = reducedMotion ? 1 : 1 - Math.exp(-delta * 4);
    orbit.target.lerp(next.target, step);
    camera.position.lerp(next.position, step);
    orbit.update();
    if (camera.position.distanceTo(next.position) < 0.01) goal.current = null;
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      enableDamping
      minPolarAngle={0.35}
      maxPolarAngle={1.15}
      minDistance={4}
      maxDistance={45}
      onStart={() => {
        goal.current = null;
      }}
    />
  );
}
