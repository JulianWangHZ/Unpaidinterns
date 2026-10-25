import { appendFile, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FileTailer } from '../src/tailer.js';

let dir: string;
let file: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'tailer-'));
  file = join(dir, 's.jsonl');
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('FileTailer', () => {
  it('returns complete lines and then only new ones', async () => {
    const tailer = new FileTailer();
    await writeFile(file, 'a\nb\n');
    expect(await tailer.readNewLines(file)).toEqual(['a', 'b']);
    await appendFile(file, 'c\n');
    expect(await tailer.readNewLines(file)).toEqual(['c']);
  });

  it('returns nothing when the file has not grown', async () => {
    const tailer = new FileTailer();
    await writeFile(file, 'a\n');
    await tailer.readNewLines(file);
    expect(await tailer.readNewLines(file)).toEqual([]);
  });

  it('buffers a partial trailing line until it is completed', async () => {
    const tailer = new FileTailer();
    await writeFile(file, 'a\npar');
    expect(await tailer.readNewLines(file)).toEqual(['a']);
    await appendFile(file, 'tial\n');
    expect(await tailer.readNewLines(file)).toEqual(['partial']);
  });

  it('keeps a multi-byte character intact across reads', async () => {
    const tailer = new FileTailer();
    const bytes = Buffer.from('€\n', 'utf8');
    await writeFile(file, bytes.subarray(0, 1));
    expect(await tailer.readNewLines(file)).toEqual([]);
    await appendFile(file, bytes.subarray(1));
    expect(await tailer.readNewLines(file)).toEqual(['€']);
  });

  it('starts over when the file is truncated', async () => {
    const tailer = new FileTailer();
    await writeFile(file, 'old line\n');
    await tailer.readNewLines(file);
    await writeFile(file, 'new\n');
    expect(await tailer.readNewLines(file)).toEqual(['new']);
  });

  it('rereads from the start after forget', async () => {
    const tailer = new FileTailer();
    await writeFile(file, 'a\n');
    await tailer.readNewLines(file);
    tailer.forget(file);
    expect(await tailer.readNewLines(file)).toEqual(['a']);
  });
});
