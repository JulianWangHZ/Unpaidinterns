import { RoundedBox } from '@react-three/drei';
import { useMemo } from 'react';
import { seeded } from '../../../lib/scenes/skyline.js';
import { Wood } from './materials.js';

type V3 = [number, number, number];

const SPINES = ['#c0563f', '#3f6fc0', '#e8c25a', '#2f8f6d', '#8f74d6', '#e07a9a', '#f1ebe0', '#5b5f97', '#d98c4a'];
const SHELF_YS = [0.04, 0.5, 0.96, 1.42];
const HEIGHT = 1.9;
const DEPTH = 0.34;

interface Book {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  lean: number;
  flat: boolean;
}

/** Fill each shelf left to right with books of varying size; now and then a leaning one or a flat stack. */
function layoutBooks(width: number, seed: number): Book[] {
  const random = seeded(seed);
  const books: Book[] = [];
  for (const shelfY of SHELF_YS) {
    let x = -width / 2 + 0.05;
    const end = width / 2 - 0.05 - (random() < 0.4 ? 0.22 : 0);
    while (x < end - 0.05) {
      const color = SPINES[Math.floor(random() * SPINES.length)] as string;
      if (random() < 0.08 && end - x > 0.26) {
        for (let i = 0; i < 3; i += 1) {
          books.push({ x: x + 0.12, y: shelfY + 0.03 + i * 0.045, width: 0.22, height: 0.04, color: SPINES[(i * 3 + books.length) % SPINES.length] as string, lean: 0, flat: true });
        }
        x += 0.27;
        continue;
      }
      const thick = 0.035 + random() * 0.05;
      const tall = 0.24 + random() * 0.14;
      const lean = random() < 0.07 ? 0.22 : 0;
      books.push({ x: x + thick / 2, y: shelfY + 0.02 + tall / 2, width: thick, height: tall, color, lean, flat: false });
      x += thick + 0.004 + (lean ? 0.06 : 0);
    }
  }
  return books;
}

export function Bookshelf({ at, rotation = 0, width = 1.3, seed = 3 }: { at: V3; rotation?: number; width?: number; seed?: number }) {
  const books = useMemo(() => layoutBooks(width, seed), [width, seed]);
  return (
    <group position={at} rotation={[0, rotation, 0]}>
      <mesh position={[0, HEIGHT / 2, -DEPTH / 2 + 0.01]} receiveShadow>
        <boxGeometry args={[width, HEIGHT, 0.02]} />
        <Wood color="#7c5a40" />
      </mesh>
      {[-1, 1].map((side) => (
        <RoundedBox key={side} args={[0.045, HEIGHT, DEPTH]} radius={0.01} smoothness={2} position={[(side * (width - 0.045)) / 2, HEIGHT / 2, 0]} castShadow>
          <Wood color="#9a7151" />
        </RoundedBox>
      ))}
      {[...SHELF_YS, HEIGHT - 0.02].map((y) => (
        <RoundedBox key={y} args={[width, 0.035, DEPTH]} radius={0.008} smoothness={2} position={[0, y, 0]} receiveShadow>
          <Wood color="#9a7151" />
        </RoundedBox>
      ))}
      {books.map((book, i) => (
        <group key={i} position={[book.x, book.y, 0.01]} rotation={[0, book.flat ? 0.08 * (i % 3) : 0, book.lean]}>
          <RoundedBox args={book.flat ? [book.width, book.height, 0.2] : [book.width, book.height, 0.22]} radius={0.005} smoothness={2} castShadow>
            <meshStandardMaterial color={book.color} roughness={0.75} />
          </RoundedBox>
          {book.flat ? null : (
            <mesh position={[0, book.height * 0.28, 0.111]}>
              <planeGeometry args={[book.width * 0.8, 0.018]} />
              <meshStandardMaterial color="#f5e6c8" roughness={0.6} />
            </mesh>
          )}
        </group>
      ))}
      <mesh position={[width / 2 - 0.15, SHELF_YS[2] as number + 0.09, 0]} castShadow>
        <sphereGeometry args={[0.07, 18, 14]} />
        <meshStandardMaterial color="#9fd8c4" roughness={0.2} />
      </mesh>
      <mesh position={[width / 2 - 0.14, SHELF_YS[0] as number + 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 0.16, 16]} />
        <meshStandardMaterial color="#f1ebe0" roughness={0.4} />
      </mesh>
    </group>
  );
}
