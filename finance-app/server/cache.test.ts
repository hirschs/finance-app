import { describe, expect, it, vi } from 'vitest';
import { TtlCache } from './cache';

describe('TtlCache', () => {
  it('serves a fresh value without reloading', async () => {
    let now = 0;
    const cache = new TtlCache<number>(() => now);
    const load = vi.fn().mockResolvedValue(1);

    expect(await cache.getOrLoad('k', 100, load)).toBe(1);
    now = 99;
    expect(await cache.getOrLoad('k', 100, load)).toBe(1);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('reloads once the entry has expired', async () => {
    let now = 0;
    const cache = new TtlCache<number>(() => now);
    const load = vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2);

    await cache.getOrLoad('k', 100, load);
    now = 100;
    expect(await cache.getOrLoad('k', 100, load)).toBe(2);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('serves the stale value when a refresh fails', async () => {
    let now = 0;
    const cache = new TtlCache<number>(() => now);

    await cache.getOrLoad('k', 100, () => Promise.resolve(1));
    now = 500;
    expect(await cache.getOrLoad('k', 100, () => Promise.reject(new Error('yahoo down')))).toBe(1);
  });

  it('propagates the error when there is nothing cached', async () => {
    const cache = new TtlCache<number>();
    await expect(cache.getOrLoad('k', 100, () => Promise.reject(new Error('yahoo down')))).rejects.toThrow('yahoo down');
  });

  it('keeps keys independent', async () => {
    const cache = new TtlCache<string>();
    await cache.getOrLoad('a', 100, () => Promise.resolve('A'));
    expect(await cache.getOrLoad('b', 100, () => Promise.resolve('B'))).toBe('B');
  });
});
