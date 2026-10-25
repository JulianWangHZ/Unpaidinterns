export type Route = 'island' | 'board';

export function parseRoute(hash: string): Route {
  return hash === '#/board' ? 'board' : 'island';
}
