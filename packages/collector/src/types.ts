import type { AgentEvent } from '@unpaidinterns/core';

export type ParseResult =
  | { kind: 'event'; event: AgentEvent }
  | { kind: 'skip' }
  | { kind: 'error'; reason: string };

export interface LineContext {
  filePath: string;
}

export type LineParser = (line: string, ctx: LineContext) => ParseResult;
