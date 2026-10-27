export type Route = 'island' | 'board';

export function parseRoute(hash: string): Route {
  return hash === '#/board' ? 'board' : 'island';
}

export function routeHash(route: Route): string {
  return `#/${route}`;
}
