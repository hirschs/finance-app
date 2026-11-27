import { COMPANIES } from '../src/config/companies';
import { normalizeQuote, normalizeSeries } from '../src/domain/normalize';
import type { RawQuote } from '../src/domain/normalize';
import { DataError } from '../src/domain/types';
import type { Company, Quote, Result, Series, WindowId } from '../src/domain/types';
import type { MarketDataService } from '../src/services/MarketDataService';
import { TtlCache } from './cache';
import { QUOTE_TTL_MS, WINDOW_QUERY } from './windowQuery';
import type { YahooClient } from './yahooClient';

const SYMBOL_PATTERN = /^[A-Z0-9][A-Z0-9.-]{0,11}$/;

export interface YahooMarketDataOptions {
  client: YahooClient;
  /**
   * Tickers the proxy will serve, with display names. Defaults to the app's company
   * list, so adding a company in `config/companies.ts` is all that is needed.
   * Keeping an allow-list stops the proxy being used as an open Yahoo relay.
   */
  companies?: readonly Company[];
  now?: () => number;
}

/** Maps whatever the Yahoo client throws onto the app's typed errors. */
export function mapYahooError(err: unknown, symbol?: string): DataError {
  if (err instanceof DataError) return err;
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes('No data found') || message.includes('Not Found')) {
    return new DataError('NOT_FOUND', `No data found for ${symbol ?? 'symbol'}`);
  }
  return new DataError('UPSTREAM', 'Market data provider is unavailable');
}

export class YahooMarketDataService implements MarketDataService {
  private readonly client: YahooClient;
  private readonly names: Map<string, string>;
  private readonly now: () => number;
  private readonly quoteCache: TtlCache<Map<string, RawQuote>>;
  private readonly seriesCache: TtlCache<Series>;

  constructor({ client, companies = COMPANIES, now = Date.now }: YahooMarketDataOptions) {
    this.client = client;
    this.now = now;
    this.names = new Map(companies.map((c) => [c.symbol, c.name]));
    this.quoteCache = new TtlCache(now);
    this.seriesCache = new TtlCache(now);
  }

  private checkSymbol(symbol: string): DataError | null {
    if (!SYMBOL_PATTERN.test(symbol)) {
      return new DataError('INVALID', `Invalid symbol "${symbol}"`);
    }
    if (!this.names.has(symbol)) {
      return new DataError('NOT_FOUND', `Symbol ${symbol} is not tracked`);
    }
    return null;
  }

  async getQuotes(symbols: string[]): Promise<Result<Quote>[]> {
    const checks = symbols.map((s) => this.checkSymbol(s));
    const valid = [...new Set(symbols.filter((_, i) => checks[i] === null))];

    let raw = new Map<string, RawQuote>();
    let batchError: DataError | null = null;
    if (valid.length > 0) {
      try {
        raw = await this.quoteCache.getOrLoad([...valid].sort().join(','), QUOTE_TTL_MS, async () => {
          const rows = await this.client.quote(valid);
          return new Map(rows.flatMap((r) => (r.symbol ? [[r.symbol, r] as const] : [])));
        });
      } catch (err) {
        batchError = mapYahooError(err);
      }
    }

    return symbols.map((symbol, i): Result<Quote> => {
      const invalid = checks[i];
      if (invalid) return { ok: false, error: invalid };
      if (batchError) return { ok: false, error: batchError };
      return normalizeQuote(symbol, raw.get(symbol), this.names.get(symbol) ?? symbol);
    });
  }

  async getSeries(symbol: string, window: WindowId): Promise<Series> {
    const invalid = this.checkSymbol(symbol);
    if (invalid) throw invalid;

    const query = WINDOW_QUERY[window];
    if (!query) throw new DataError('INVALID', `Unknown window "${window}"`);

    try {
      return await this.seriesCache.getOrLoad(`${symbol}:${window}`, query.ttlMs, async () => {
        const raw = await this.client.chart(symbol, {
          period1: new Date(this.now() - query.lookbackMs),
          interval: query.interval,
        });
        const series = normalizeSeries(symbol, window, raw);
        if (series.points.length === 0) {
          throw new DataError('NOT_FOUND', `No price data for ${symbol} in this window`);
        }
        return series;
      });
    } catch (err) {
      throw mapYahooError(err, symbol);
    }
  }
}
