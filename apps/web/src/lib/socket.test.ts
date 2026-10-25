import { describe, expect, it } from 'vitest';
import { connectSessions, parseMessage, reconnectDelay, type SocketLike } from './socket.js';

class FakeSocket implements SocketLike {
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onclose: (() => void) | null = null;
  closed = false;
  close(): void {
    this.closed = true;
  }
}

function harness() {
  const sockets: FakeSocket[] = [];
  const scheduled: Array<{ fn: () => void; ms: number }> = [];
  const statuses: string[] = [];
  const messages: unknown[] = [];
  const stop = connectSessions({
    url: 'ws://test/ws',
    onMessage: (message) => messages.push(message),
    onStatus: (status) => statuses.push(status),
    createSocket: () => {
      const socket = new FakeSocket();
      sockets.push(socket);
      return socket;
    },
    schedule: (fn, ms) => scheduled.push({ fn, ms }),
  });
  return { sockets, scheduled, statuses, messages, stop };
}

describe('reconnectDelay', () => {
  it('doubles from one second and caps at fifteen', () => {
    expect([0, 1, 2, 3, 4, 10].map(reconnectDelay)).toEqual([1000, 2000, 4000, 8000, 15_000, 15_000]);
  });
});

describe('parseMessage', () => {
  it('accepts a valid message', () => {
    expect(parseMessage('{"type":"remove","sessionId":"s1"}')).toEqual({ type: 'remove', sessionId: 's1' });
  });

  it.each([42, '{bad', '{"type":"nope"}'])('rejects %s', (data) => {
    expect(parseMessage(data)).toBeNull();
  });
});

describe('connectSessions', () => {
  it('forwards valid messages and reports status', () => {
    const h = harness();
    h.sockets[0]?.onopen?.();
    h.sockets[0]?.onmessage?.({ data: '{"type":"remove","sessionId":"s1"}' });
    h.sockets[0]?.onmessage?.({ data: 'garbage' });
    expect(h.statuses).toEqual(['connecting', 'open']);
    expect(h.messages).toEqual([{ type: 'remove', sessionId: 's1' }]);
  });

  it('reconnects with backoff and resets it after a successful open', () => {
    const h = harness();
    h.sockets[0]?.onclose?.();
    h.scheduled[0]?.fn();
    h.sockets[1]?.onclose?.();
    expect(h.scheduled.map((s) => s.ms)).toEqual([1000, 2000]);
    h.scheduled[1]?.fn();
    h.sockets[2]?.onopen?.();
    h.sockets[2]?.onclose?.();
    expect(h.scheduled[2]?.ms).toBe(1000);
  });

  it('does not reconnect after stop', () => {
    const h = harness();
    h.stop();
    h.sockets[0]?.onclose?.();
    expect(h.sockets[0]?.closed).toBe(true);
    expect(h.scheduled).toEqual([]);
  });
});
