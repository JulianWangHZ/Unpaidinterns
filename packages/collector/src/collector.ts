import type { Stats } from 'node:fs';
import { stat } from 'node:fs/promises';
import { watch, type FSWatcher } from 'chokidar';
import type { AgentEvent } from '@unpaidinterns/core';
import { FileTailer } from './tailer.js';
import type { LineParser } from './types.js';

export interface SourceConfig {
  dir: string;
  parse: LineParser;
}

export interface ParseIssue {
  filePath: string;
  reason: string;
}

export interface CollectorOptions {
  sources: SourceConfig[];
  onEvent(event: AgentEvent): void;
  onParseError?(issue: ParseIssue): void;
  maxFileAgeMs: number;
  usePolling?: boolean;
  now?: () => number;
}

export interface Collector {
  ready: Promise<void>;
  close(): Promise<void>;
}

const SESSION_FILE = /\.jsonl$/;

export function startCollector(options: CollectorOptions): Collector {
  const tailer = new FileTailer();
  const now = options.now ?? Date.now;
  // One promise chain per file so overlapping change events never read the same bytes twice.
  const queues = new Map<string, Promise<void>>();

  async function readFile(source: SourceConfig, filePath: string, stats?: Stats): Promise<void> {
    const mtimeMs = stats?.mtimeMs ?? (await stat(filePath)).mtimeMs;
    if (now() - mtimeMs > options.maxFileAgeMs) return;
    const lines = await tailer.readNewLines(filePath);
    for (const line of lines) {
      const result = source.parse(line, { filePath });
      if (result.kind === 'event') options.onEvent(result.event);
      else if (result.kind === 'error') options.onParseError?.({ filePath, reason: result.reason });
    }
  }

  function enqueue(source: SourceConfig, filePath: string, stats?: Stats): void {
    if (!SESSION_FILE.test(filePath)) return;
    const previous = queues.get(filePath) ?? Promise.resolve();
    const next = previous
      .then(() => readFile(source, filePath, stats))
      .catch((error: unknown) => options.onParseError?.({ filePath, reason: String(error) }));
    queues.set(filePath, next);
  }

  const watchers: FSWatcher[] = options.sources.map((source) =>
    watch(source.dir, { ignoreInitial: false, usePolling: options.usePolling ?? false, interval: 100 })
      .on('add', (filePath, stats) => enqueue(source, filePath, stats))
      .on('change', (filePath, stats) => enqueue(source, filePath, stats))
      .on('unlink', (filePath) => tailer.forget(filePath)),
  );

  const ready = Promise.all(
    watchers.map((watcher) => new Promise<void>((resolve) => watcher.once('ready', () => resolve()))),
  ).then(() => undefined);

  return {
    ready,
    close: async () => {
      await Promise.all(watchers.map((watcher) => watcher.close()));
      await Promise.all(queues.values());
    },
  };
}
