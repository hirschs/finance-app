import { describe, expect, it } from 'vitest';
import { normalizeQuote, normalizeSeries } from './normalize';

const T = Date.UTC(2025, 0, 15, 15, 0, 0);

describe('normalizeQuote', () => {
  it('maps a complete Yahoo quote', () => {
    const r = normalizeQuote(
      'IBM',
      {
        regularMarketPrice: 235.62,
        regularMarketChange: 2.62,
        regularMarketChangePercent: 1.12446,
        regularMarketTime: new Date(T),
        currency: 'USD',
      },
      'IBM',
    );
    expect(r).toEqual({
      ok: true,
      value: { symbol: 'IBM', name: 'IBM', currency: 'USD', price: 235.62, change: 2.62, changePct: 1.12446, asOf: T },
    });
  });

  it('derives change and percent from previous close when Yahoo omits them', () => {
    const r = normalizeQuote(
      'MSFT',
      { regularMarketPrice: 110, regularMarketPreviousClose: 100, regularMarketTime: T },
      'Microsoft',
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.change).toBeCloseTo(10);
      expect(r.value.changePct).toBeCloseTo(10);
      expect(r.value.currency).toBe('USD');
    }
  });

  it('reports NOT_FOUND when Yahoo returned nothing for the symbol', () => {
    const r = normalizeQuote('NOPE', undefined, 'NOPE');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('reports UPSTREAM when required fields are missing', () => {
    const r = normalizeQuote('IBM', { regularMarketTime: T }, 'IBM');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('UPSTREAM');
  });
});

describe('normalizeSeries', () => {
  it('drops null/non-finite closes, sorts ascending and de-duplicates by time', () => {
    const s = normalizeSeries('IBM', 'quarter', {
      quotes: [
        { date: new Date(T + 2000), close: 12 },
        { date: new Date(T), close: 10 },
        { date: new Date(T + 1000), close: null },
        { date: new Date(T + 3000), close: Number.NaN },
        { date: new Date(T), close: 11 },
      ],
    });
    expect(s.points).toEqual([
      { t: T, close: 11 },
      { t: T + 2000, close: 12 },
    ]);
  });

  it('keeps only the latest trading session for the day window', () => {
    const DAY = 86_400_000;
    const s = normalizeSeries('IBM', 'day', {
      meta: { gmtoffset: -18000 },
      quotes: [
        { date: new Date(T - 3 * DAY), close: 1 },
        { date: new Date(T - 3 * DAY + 60_000), close: 2 },
        { date: new Date(T), close: 3 },
        { date: new Date(T + 60_000), close: 4 },
      ],
    });
    expect(s.points.map((p) => p.close)).toEqual([3, 4]);
  });

  it('keeps the full range for the week window', () => {
    const DAY = 86_400_000;
    const s = normalizeSeries('IBM', 'week', {
      quotes: [
        { date: new Date(T - 3 * DAY), close: 1 },
        { date: new Date(T), close: 2 },
      ],
    });
    expect(s.points).toHaveLength(2);
  });

  it('returns an empty series for an empty payload', () => {
    expect(normalizeSeries('IBM', 'day', {}).points).toEqual([]);
  });
});
