import type { ReactNode } from 'react';
import type { SceneDefinition, SceneId } from '../../lib/scenes/types.js';
import { OfficeDecor } from './office/OfficeDecor.js';
import { OfficeShell } from './office/OfficeShell.js';
import { ParkGrounds } from './park/ParkGrounds.js';
import { PoolGrounds } from './pool/PoolGrounds.js';

interface EnvironmentProps {
  scene: SceneDefinition;
  seatCount: number;
  time: 'day' | 'night';
}

/** The office is a cut-away tower: three floors, five rooms, seen from the open front. */
function OfficeTower({ time }: EnvironmentProps) {
  return (
    <group>
      <OfficeShell time={time} />
      <OfficeDecor />
    </group>
  );
}

const ENVIRONMENTS: Record<SceneId, (props: EnvironmentProps) => ReactNode> = {
  office: OfficeTower,
  park: ParkGrounds,
  pool: PoolGrounds,
};

export function Environment(props: EnvironmentProps) {
  const Scene = ENVIRONMENTS[props.scene.id];
  return <Scene {...props} />;
}

