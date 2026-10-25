import { describe, expect, it } from 'vitest';
import { createApi } from './api.js';

function fakeFetch(status: number, body: unknown) {
  const calls: Array<{ url: string; init: RequestInit | undefined }> = [];
  const fetcher = async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    return new Response(body === null ? null : JSON.stringify(body), { status });
  };
  return { calls, fetcher };
}

describe('createApi', () => {
  it('creates a task with a JSON body', async () => {
    const { calls, fetcher } = fakeFetch(201, { task: { id: 't1' } });
    const task = await createApi(fetcher).createTask({ title: 'A' });
    expect(task).toEqual({ id: 't1' });
    expect(calls[0]?.url).toBe('/api/tasks');
    expect(calls[0]?.init?.method).toBe('POST');
    expect(calls[0]?.init?.body).toBe('{"title":"A"}');
  });

  it('patches and deletes by id', async () => {
    const patch = fakeFetch(200, { task: { id: 't 1' } });
    await createApi(patch.fetcher).patchTask('t 1', { column: 'done' });
    expect(patch.calls[0]?.url).toBe('/api/tasks/t%201');
    const del = fakeFetch(204, null);
    await createApi(del.fetcher).deleteTask('t1');
    expect(del.calls[0]?.init?.method).toBe('DELETE');
  });

  it('lists tasks', async () => {
    const { fetcher } = fakeFetch(200, { tasks: [] });
    expect(await createApi(fetcher).listTasks()).toEqual([]);
  });

  it('throws the server error message', async () => {
    const { fetcher } = fakeFetch(400, { error: 'Invalid task: title must not be empty.' });
    await expect(createApi(fetcher).createTask({ title: '' })).rejects.toThrow('Invalid task: title must not be empty.');
  });

  it('throws a generic message when the error body is unreadable', async () => {
    const fetcher = async () => new Response('oops', { status: 500 });
    await expect(createApi(fetcher).listTasks()).rejects.toThrow('Request failed with status 500');
  });
});
