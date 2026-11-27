import { describe, expect, it } from 'vitest';
import {
  percentChange,
  rankPerformance,
  rebase,
  seriesPerformance,
  summarize,
  toChartRows,
} from './metrics';

describe('rebase', () => {
  it('expresses each point as % change from the first', () => {
    const out = rebase([
      { t: 1, close: 100 },
      { t: 2, close: 110 },
      { t: 3, close: 90 },
    ]);
    expect(out[0].close).toBe(0);
    expect(out[1].close).toBeCloseTo(10);
    expect(out[2].close).toBeCloseTo(-10);
  });

  it('returns an empty array for empty or zero-based input', () => {
    expect(rebase([])).toEqual([]);
    expect(rebase([{ t: 1, close: 0 }])).toEqual([]);
  });
});

describe('percentChange', () => {
  it('computes first-to-last change', () => {
    expect(percentChange([{ t: 1, close: 50 }, { t: 2, close: 55 }])).toBeCloseTo(10);
  });

  it('is null with fewer than two points', () => {
    expect(percentChange([{ t: 1, close: 50 }])).toBeNull();
  });
});

describe('toChartRows', () => {
  it('merges series by timestamp and sorts ascending', () => {
    const rows = toChartRows([
      { symbol: 'A', window: 'day', points: [{ t: 2, close: 20 }, { t: 1, close: 10 }] },
      { symbol: 'B', window: 'day', points: [{ t: 2, close: 5 }] },
    ]);
    expect(rows.map((r) => r.t)).toEqual([1, 2]);
    expect(rows[1].B).toBe(0);
  });
});

describe('rankPerformance / seriesPerformance', () => {
  const companies = [
    { symbol: 'A', name: 'Alpha' },
    { symbol: 'B', name: 'Beta' },
  ];

  it('ranks best performer first without mutating the input', () => {
    const input = [
      { symbol: 'A', name: 'Alpha', changePct: -1 },
      { symbol: 'B', name: 'Beta', changePct: 3 },
    ];
    expect(rankPerformance(input).map((e) => e.symbol)).toEqual(['B', 'A']);
    expect(input[0].symbol).toBe('A');
  });

  it('measures first-to-last change, uses config names, and skips unmeasurable series', () => {
    const ranked = seriesPerformance(
      [
        { symbol: 'A', window: 'week', points: [{ t: 1, close: 100 }, { t: 2, close: 90 }] },
        { symbol: 'B', window: 'week', points: [{ t: 1, close: 50 }, { t: 2, close: 60 }] },
        { symbol: 'C', window: 'week', points: [{ t: 1, close: 5 }] },
      ],
      companies,
    );
    expect(ranked.map((e) => [e.symbol, e.name])).toEqual([['B', 'Beta'], ['A', 'Alpha']]);
    expect(ranked[0].changePct).toBeCloseTo(20);
    expect(ranked[1].changePct).toBeCloseTo(-10);
  });
});

describe('summarize', () => {
  const ranked = [
    { symbol: 'B', name: 'Beta', changePct: 4 },
    { symbol: 'IBM', name: 'IBM', changePct: 2 },
    { symbol: 'C', name: 'Gamma', changePct: -2 },
  ];

  it('reports leader, laggard, focus rank, peer average and the gap to peers', () => {
    const s = summarize(ranked, 'IBM');
    expect(s.leader?.symbol).toBe('B');
    expect(s.laggard?.symbol).toBe('C');
    expect(s.focus?.rank).toBe(2);
    expect(s.peerAverage).toBeCloseTo(1);
    expect(s.vsPeers).toBeCloseTo(1);
  });

  it('copes with a missing focus company or an empty list', () => {
    const noFocus = summarize(ranked.filter((e) => e.symbol !== 'IBM'), 'IBM');
    expect(noFocus.focus).toBeNull();
    expect(noFocus.vsPeers).toBeNull();

    const empty = summarize([], 'IBM');
    expect(empty.leader).toBeNull();
    expect(empty.laggard).toBeNull();
    expect(empty.peerAverage).toBeNull();
  });

  it('has no laggard when only one company is ranked', () => {
    expect(summarize([ranked[1]], 'IBM').laggard).toBeNull();
  });
});
