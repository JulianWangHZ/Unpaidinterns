import { BUILDING, FLOOR_HEIGHT, ROOMS, STAIR, type Room } from '../../../lib/scenes/office.js';
import { ROOM_ACCENT } from './palette.js';
import { ArcadeCabinet, Beanbag, Bookshelf, FloorLamp, Poster, Pot, Rug, Sofa, Staircase, VendingMachine, WallClock, Whiteboard } from './Props.js';

const WALL_Z = BUILDING.back + 0.25;

/** Shared furnishing for the three agent rooms: shelf, lamp, plant, whiteboard and a rug in the room colour. */
function AgentRoomDecor({ room, seed }: { room: Room; seed: number }) {
  const y = room.floor * FLOOR_HEIGHT;
  const centre = (room.left + room.right) / 2;
  return (
    <group>
      <Rug at={[centre, y, -0.2]} size={[room.right - room.left - 1, 3.6]} color={ROOM_ACCENT[room.id]} />
      <Bookshelf at={[room.right - 0.85, y, WALL_Z - 0.05]} width={1.2} seed={seed} />
      <FloorLamp at={[room.left + 0.45, y, WALL_Z + 0.15]} />
      <Pot at={[room.right - 1.8, y, BUILDING.back + 0.4]} size={1.1} seed={seed + 1} />
      <Whiteboard at={[room.left + 1.6, y + 1.85, WALL_Z - 0.1]} />
      <WallClock at={[room.right - 2.2, y + 2.95, BUILDING.back + 0.14]} />
    </group>
  );
}

function LoungeDecor() {
  const room = ROOMS.lounge;
  const y = room.floor * FLOOR_HEIGHT;
  return (
    <group>
      <Rug at={[(room.left + room.right) / 2, y, 0.4]} size={[room.right - room.left - 0.6, 2.4]} color={ROOM_ACCENT.lounge} />
      <Poster at={[2.9, y + 1.95, BUILDING.back + 0.14]} color="#ff8fbf" />
      <Poster at={[8.6, y + 1.95, BUILDING.back + 0.14]} color="#8fd8ff" width={0.6} />
      <Pot at={[9.2, y, 1.6]} size={1.3} seed={41} />
    </group>
  );
}

function RecDecor() {
  const room = ROOMS.rec;
  return (
    <group>
      <Rug at={[-4.8, 0, 0.1]} size={[5, 3]} color="#9fd8c4" />
      <Rug at={[0, 0, 0.4]} size={[3.2, 2.6]} color={ROOM_ACCENT.rec} />
      <Sofa at={[0, 0, -0.2]} />
      <Bookshelf at={[room.left + 0.9, 0, WALL_Z - 0.05]} width={1.4} seed={53} />
      <Staircase from={[...STAIR.from]} to={[...STAIR.to]} width={STAIR.width} />
      <FloorLamp at={[-1.7, 0, -1.5]} />
      <Pot at={[room.left + 0.4, 0, 1.7]} size={1.3} seed={59} />
      <Pot at={[room.right - 0.4, 0, 1.7]} size={1.3} seed={61} />
      {/* Arcades stand apart, each angled toward the room. */}
      <group position={[-9.0, 0, -0.9]} rotation={[0, 0.7, 0]}>
        <ArcadeCabinet seed={2} />
      </group>
      <group position={[2.2, 0, -1.65]} rotation={[0, -0.25, 0]}>
        <ArcadeCabinet color="#2f9e83" stripe="#ff5d7a" seed={5} />
      </group>
      <group position={[9.0, 0, -1.6]}>
        <VendingMachine />
      </group>
      <Beanbag at={[1.6, 0, 1.4]} color="#ff8fbf" />
      <Beanbag at={[-1.6, 0, 1.5]} color="#6f9dff" />
      <Poster at={[-5.4, 1.95, BUILDING.back + 0.14]} color="#ffc26b" />
      <Poster at={[2.6, 1.95, BUILDING.back + 0.14]} color="#9fd8c4" width={0.6} />
      <WallClock at={[-2.6, 2.95, BUILDING.back + 0.14]} />
    </group>
  );
}

export function OfficeDecor() {
  return (
    <group>
      <AgentRoomDecor room={ROOMS.claude} seed={11} />
      <AgentRoomDecor room={ROOMS.codex} seed={23} />
      <AgentRoomDecor room={ROOMS.gemini} seed={37} />
      <LoungeDecor />
      <RecDecor />
    </group>
  );
}
