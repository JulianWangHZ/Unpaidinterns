import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { Vec3 } from '../../lib/scenes/types.js';
import { useIslandStore } from './island-store.js';

interface CameraRigProps {
  focus: Vec3 | null;
  overviewTarget: Vec3;
  overviewOffset: Vec3;
  closeOffset: Vec3;
  reducedMotion: boolean;
}

/** Orbit controls plus a short glide back to the scene overview when asked. */
export function CameraRig({ focus, overviewTarget, overviewOffset, closeOffset, reducedMotion }: CameraRigProps) {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const goal = useRef<{ target: Vector3; position: Vector3 } | null>(null);
  const overviewRequest = useIslandStore((state) => state.overviewRequest);

  useEffect(() => {
    const target = new Vector3(...(focus ?? overviewTarget));
    const offset = new Vector3(...(focus ? closeOffset : overviewOffset));
    goal.current = { target, position: target.clone().add(offset) };
    // overviewRequest re-runs this when the Overview button asks for the starting view again.
  }, [focus, overviewTarget, overviewOffset, closeOffset, overviewRequest]);

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
      minPolarAngle={0.3}
      maxPolarAngle={1.6}
      minDistance={3}
      maxDistance={70}
      // Only user input fires onStart, so the glide back to the overview never counts as a move.
      onStart={() => {
        goal.current = null;
        useIslandStore.getState().setCameraMoved(true);
      }}
    />
  );
}
