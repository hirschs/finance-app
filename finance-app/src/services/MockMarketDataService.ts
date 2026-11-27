import { COMPANIES } from '../config/companies';
import { DataError } from '../domain/types';
import type { PricePoint, Quote, Result, Series, WindowId } from '../domain/types';
import type { MarketDataService } from './MarketDataService';

const POINTS: Record<WindowId, { count: number; stepMs: number }> = {
  day: { count: 78, stepMs: 5 * 60_000 },
  week: { count: 35, stepMs: 4 * 3_600_000 },
  quarter: { count: 63, stepMs: 86_400_000 },
};

/** Starting prices for known tickers; any other configured company gets a default. */
const BASE_PRICE: Record<string, number> = {
  IBM: 230,
  MSFT: 420,
  ORCL: 170,
  SAP: 250,
  CRM: 300,
};
const DEFAULT_BASE_PRICE = 100;

function isKnown(symbol: string): boolean {
  return COMPANIES.some((c) => c.symbol === symbol);
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Small deterministic PRNG so mock data is stable across runs and tests. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Timestamps are snapped to the step so every symbol shares the same x values. */
function buildPoints(symbol: string, window: WindowId, now: number): PricePoint[] {
  const { count, stepMs } = POINTS[window];
  const rand = mulberry32(hash(`${symbol}:${window}`));
  const end = Math.floor(now / stepMs) * stepMs;
  let close = BASE_PRICE[symbol] ?? DEFAULT_BASE_PRICE;
  const points: PricePoint[] = [];
  for (let i = 0; i < count; i++) {
    close *= 1 + (rand() - 0.48) * 0.01;
    points.push({ t: end - (count - 1 - i) * stepMs, close: Number(close.toFixed(2)) });
  }
  return points;
}

export class MockMarketDataService implements MarketDataService {
  constructor(
    private readonly now: () => number = Date.now,
    private readonly latencyMs = 150,
  ) {}

  private async delay(): Promise<void> {
    if (this.latencyMs > 0) await new Promise((r) => setTimeout(r, this.latencyMs));
  }

  async getSeries(symbol: string, window: WindowId): Promise<Series> {
    await this.delay();
    if (!isKnown(symbol)) throw new DataError('NOT_FOUND', `Unknown symbol ${symbol}`);
    return { symbol, window, points: buildPoints(symbol, window, this.now()) };
  }

  async getQuotes(symbols: string[]): Promise<Result<Quote>[]> {
    await this.delay();
    return symbols.map((symbol): Result<Quote> => {
      if (!isKnown(symbol)) {
        return { ok: false, error: new DataError('NOT_FOUND', `Unknown symbol ${symbol}`) };
      }
      const points = buildPoints(symbol, 'day', this.now());
      const first = points[0].close;
      const price = points[points.length - 1].close;
      return {
        ok: true,
        value: {
          symbol,
          name: COMPANIES.find((c) => c.symbol === symbol)?.name ?? symbol,
          currency: 'USD',
          price,
          change: Number((price - first).toFixed(2)),
          changePct: (price / first - 1) * 100,
          asOf: points[points.length - 1].t,
        },
      };
    });
  }
}
