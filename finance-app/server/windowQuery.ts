import type { WindowId } from '../src/domain/types';
import type { ChartInterval } from './yahooClient';

const DAY_MS = 86_400_000;

export interface WindowQuery {
  /** How far back to request from Yahoo. */
  lookbackMs: number;
  interval: ChartInterval;
  /** How long a fetched series stays fresh in the proxy cache. */
  ttlMs: number;
}

/**
 * Keyed by WindowId, so adding a window to the domain fails to compile until
 * it is configured here.
 */
export const WINDOW_QUERY: Record<WindowId, WindowQuery> = {
  // 5 days of lookback guarantees a full session exists even after weekends and holidays;
  // normalizeSeries then trims to the latest session.
  day: { lookbackMs: 5 * DAY_MS, interval: '5m', ttlMs: 60_000 },
  week: { lookbackMs: 7 * DAY_MS, interval: '30m', ttlMs: 5 * 60_000 },
  // "Last quarter" = trailing ~3 months.
  quarter: { lookbackMs: 90 * DAY_MS, interval: '1d', ttlMs: 60 * 60_000 },
};

export const QUOTE_TTL_MS = 60_000;
