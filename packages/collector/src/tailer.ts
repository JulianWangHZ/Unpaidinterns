import { open, stat } from 'node:fs/promises';
import { StringDecoder } from 'node:string_decoder';

interface FileCursor {
  offset: number;
  partial: string;
  decoder: StringDecoder;
}

function freshCursor(): FileCursor {
  return { offset: 0, partial: '', decoder: new StringDecoder('utf8') };
}

/** Reads only bytes appended since the previous call, split into complete lines. */
export class FileTailer {
  readonly #cursors = new Map<string, FileCursor>();

  async readNewLines(filePath: string): Promise<string[]> {
    const { size } = await stat(filePath);
    const previous = this.#cursors.get(filePath);
    // A smaller file means it was truncated or replaced, so start over.
    const cursor = previous && size >= previous.offset ? previous : freshCursor();
    if (size === cursor.offset) {
      this.#cursors.set(filePath, cursor);
      return [];
    }

    const length = size - cursor.offset;
    const buffer = Buffer.alloc(length);
    const handle = await open(filePath, 'r');
    try {
      await handle.read(buffer, 0, length, cursor.offset);
    } finally {
      await handle.close();
    }

    const lines = (cursor.partial + cursor.decoder.write(buffer)).split('\n');
    const partial = lines.pop() ?? '';
    this.#cursors.set(filePath, { offset: size, partial, decoder: cursor.decoder });
    return lines.filter((line) => line.length > 0);
  }

  forget(filePath: string): void {
    this.#cursors.delete(filePath);
  }
}
