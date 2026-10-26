/** A small brand-coloured gem floating above the head, so the agent stays recognisable in any costume. */
export function AgentBadge({ color, height }: { color: string; height: number }) {
  return (
    <mesh position={[0, height, 0]}>
      <octahedronGeometry args={[0.055, 0]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} flatShading />
    </mesh>
  );
}
