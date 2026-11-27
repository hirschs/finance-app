import type { Company, PricePoint, Series } from './types';

/** Percentage change from the first point of a series; empty input yields empty output. */
export function rebase(points: PricePoint[]): PricePoint[] {
  const first = points[0]?.close;
  if (!first) return [];
  return points.map((p) => ({ t: p.t, close: (p.close / first - 1) * 100 }));
}

export function percentChange(points: PricePoint[]): number | null {
  if (points.length < 2) return null;
  const first = points[0].close;
  if (!first) return null;
  return (points[points.length - 1].close / first - 1) * 100;
}

export type ChartRow = { t: number } & Record<string, number>;

/** Merge several series into one row per timestamp, values rebased to % change. */
export function toChartRows(series: Series[]): ChartRow[] {
  const rows = new Map<number, ChartRow>();
  for (const s of series) {
    for (const p of rebase(s.points)) {
      const row = rows.get(p.t) ?? ({ t: p.t } as ChartRow);
      row[s.symbol] = p.close;
      rows.set(p.t, row);
    }
  }
  return [...rows.values()].sort((a, b) => a.t - b.t);
}

export interface PerformanceEntry {
  symbol: string;
  name: string;
  changePct: number;
}

/** Best performer first. */
export function rankPerformance(entries: PerformanceEntry[]): PerformanceEntry[] {
  return [...entries].sort((a, b) => b.changePct - a.changePct);
}

/** First-to-last % change per series, ranked. Series too short to measure are skipped. */
export function seriesPerformance(
  series: Series[],
  companies: readonly Company[],
): PerformanceEntry[] {
  return rankPerformance(
    series.flatMap((s) => {
      const changePct = percentChange(s.points);
      if (changePct === null) return [];
      const name = companies.find((c) => c.symbol === s.symbol)?.name ?? s.symbol;
      return [{ symbol: s.symbol, name, changePct }];
    }),
  );
}

export interface PerformanceSummary {
  leader: PerformanceEntry | null;
  laggard: PerformanceEntry | null;
  /** The focus company (IBM) with its 1-based rank, or null if it has no data. */
  focus: { entry: PerformanceEntry; rank: number } | null;
  /** Mean change of everyone except the focus company. */
  peerAverage: number | null;
  /** Focus change minus peer average, in percentage points. */
  vsPeers: number | null;
}

/** `ranked` must already be sorted best-first (see rankPerformance). */
export function summarize(ranked: PerformanceEntry[], focusSymbol: string): PerformanceSummary {
  const index = ranked.findIndex((e) => e.symbol === focusSymbol);
  const focus = index >= 0 ? { entry: ranked[index], rank: index + 1 } : null;
  const peers = ranked.filter((e) => e.symbol !== focusSymbol);
  const peerAverage = peers.length
    ? peers.reduce((sum, e) => sum + e.changePct, 0) / peers.length
    : null;
  return {
    leader: ranked[0] ?? null,
    laggard: ranked.length > 1 ? ranked[ranked.length - 1] : null,
    focus,
    peerAverage,
    vsPeers: focus && peerAverage !== null ? focus.entry.changePct - peerAverage : null,
  };
}
