import { describe, expect, it } from 'vitest';
import { DataError } from '../domain/types';
import { MockMarketDataService } from './MockMarketDataService';

const FIXED_NOW = Date.UTC(2025, 0, 15, 15, 0, 0);
const service = new MockMarketDataService(() => FIXED_NOW, 0);

describe('MockMarketDataService', () => {
  it('returns deterministic, ascending series', async () => {
    const a = await service.getSeries('IBM', 'week');
    const b = await service.getSeries('IBM', 'week');
    expect(a).toEqual(b);
    const times = a.points.map((p) => p.t);
    expect(times).toEqual([...times].sort((x, y) => x - y));
  });

  it('rejects unknown symbols with a typed error', async () => {
    await expect(service.getSeries('NOPE', 'day')).rejects.toBeInstanceOf(DataError);
  });

  it('returns per-symbol results so one bad ticker does not fail the batch', async () => {
    const results = await service.getQuotes(['IBM', 'NOPE']);
    expect(results[0].ok).toBe(true);
    expect(results[1].ok).toBe(false);
  });
});
