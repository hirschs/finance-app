import { DataError } from './types';
import type { PricePoint, Quote, Result, Series, WindowId } from './types';

/**
 * Minimal shapes we read from Yahoo Finance. Every field is optional on purpose:
 * Yahoo is unofficial and may omit or null fields, so nothing is trusted until checked here.
 */
export interface RawQuote {
  symbol?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketPreviousClose?: number;
  regularMarketTime?: Date | number | string;
  currency?: string;
  longName?: string;
  shortName?: string;
}

export interface RawChartQuote {
  date?: Date | number | string;
  close?: number | null;
}

export interface RawChart {
  meta?: { gmtoffset?: number };
  quotes?: RawChartQuote[];
}

const DAY_MS = 86_400_000;

function isNum(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function toMillis(v: Date | number | string | undefined): number | undefined {
  if (v === undefined || v === null) return undefined;
  const ms = v instanceof Date ? v.getTime() : new Date(v).getTime();
  return Number.isFinite(ms) ? ms : undefined;
}

function incomplete(symbol: string): Result<Quote> {
  return { ok: false, error: new DataError('UPSTREAM', `Incomplete quote data for ${symbol}`) };
}

/** `name` is chosen by the caller so display names can come from app config. */
export function normalizeQuote(
  symbol: string,
  raw: RawQuote | undefined,
  name: string,
): Result<Quote> {
  if (!raw) {
    return { ok: false, error: new DataError('NOT_FOUND', `No quote found for ${symbol}`) };
  }

  const price = raw.regularMarketPrice;
  const asOf = toMillis(raw.regularMarketTime);
  if (!isNum(price) || asOf === undefined) return incomplete(symbol);

  const prev = raw.regularMarketPreviousClose;
  const change = isNum(raw.regularMarketChange)
    ? raw.regularMarketChange
    : isNum(prev)
      ? price - prev
      : undefined;
  if (change === undefined) return incomplete(symbol);

  // Yahoo reports changePercent already as a percentage (1.12 means 1.12%).
  const base = price - change;
  const changePct = isNum(raw.regularMarketChangePercent)
    ? raw.regularMarketChangePercent
    : base !== 0
      ? (change / base) * 100
      : undefined;
  if (changePct === undefined) return incomplete(symbol);

  return {
    ok: true,
    value: { symbol, name, currency: raw.currency ?? 'USD', price, change, changePct, asOf },
  };
}

/**
 * Cleans a chart payload into an ascending, de-duplicated series.
 * Points without a finite close (holidays, halted trading) are dropped, never interpolated.
 * For the `day` window only the most recent trading session is kept, so a weekend or
 * pre-market view shows the last completed session instead of several days.
 */
export function normalizeSeries(symbol: string, window: WindowId, raw: RawChart): Series {
  const byTime = new Map<number, number>();
  for (const q of raw.quotes ?? []) {
    const t = toMillis(q.date);
    if (t !== undefined && isNum(q.close)) byTime.set(t, q.close);
  }

  let points: PricePoint[] = [...byTime.entries()]
    .map(([t, close]) => ({ t, close }))
    .sort((a, b) => a.t - b.t);

  if (window === 'day' && points.length > 0) {
    const offsetMs = (raw.meta?.gmtoffset ?? 0) * 1000;
    const localDay = (t: number) => Math.floor((t + offsetMs) / DAY_MS);
    const lastDay = localDay(points[points.length - 1].t);
    points = points.filter((p) => localDay(p.t) === lastDay);
  }

  return { symbol, window, points };
}
