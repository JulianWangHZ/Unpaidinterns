import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import type { Group } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { Pose } from '../../lib/island/behavior.js';
import { clipFor } from '../../lib/scenes/manifest.js';
import type { Motion } from './characters/motion.js';

interface ModelCharacterProps {
  url: string;
  scale: number;
  pose: Pose;
  motion: MutableRefObject<Motion>;
}

const FADE_S = 0.25;

/** A character from a .glb file. Plays the clip that matches the current pose, crossfading between them. */
export function ModelCharacter({ url, scale, pose, motion }: ModelCharacterProps) {
  const { scene, animations } = useGLTF(url);
  // Each agent needs its own skeleton, so the shared glTF scene is cloned per character.
  const model = useMemo(() => clone(scene), [scene]);
  const root = useRef<Group>(null);
  const { actions, names } = useAnimations(animations, root);
  const [walking, setWalking] = useState(false);

  useFrame(() => {
    if (motion.current.walking !== walking) setWalking(motion.current.walking);
  });

  useEffect(() => {
    const name = clipFor(pose, names, walking);
    const action = name ? actions[name] : undefined;
    action?.reset().fadeIn(FADE_S).play();
    return () => {
      action?.fadeOut(FADE_S);
    };
  }, [actions, names, pose, walking]);

  return (
    <group ref={root} scale={scale}>
      <primitive object={model} />
    </group>
  );
}
