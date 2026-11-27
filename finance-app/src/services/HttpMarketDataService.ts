import { DataError } from '../domain/types';
import type { Quote, Result, Series, WindowId } from '../domain/types';
import { fromWireError, fromWireResult, isWireError } from '../domain/wire';
import type { QuotesResponse, SeriesResponse } from '../domain/wire';
import type { MarketDataService } from './MarketDataService';

/** Talks to the Node proxy (`server/`), which is the only thing that calls Yahoo Finance. */
export class HttpMarketDataService implements MarketDataService {
  constructor(
    private readonly baseUrl = '/api',
    private readonly fetchFn: typeof fetch = (...args) => fetch(...args),
  ) {}

  private async get<T>(path: string): Promise<T> {
    let res: Response;
    try {
      res = await this.fetchFn(`${this.baseUrl}${path}`);
    } catch {
      throw new DataError('NETWORK', 'Cannot reach the market data service');
    }

    let body: unknown;
    try {
      body = await res.json();
    } catch {
      throw new DataError('UPSTREAM', `Unexpected response from market data service (${res.status})`);
    }

    if (!res.ok) {
      const error = (body as { error?: unknown } | null)?.error;
      if (isWireError(error)) throw fromWireError(error);
      throw new DataError('UPSTREAM', `Market data service error (${res.status})`);
    }
    return body as T;
  }

  async getQuotes(symbols: string[]): Promise<Result<Quote>[]> {
    const body = await this.get<QuotesResponse>(`/quotes?symbols=${encodeURIComponent(symbols.join(','))}`);
    return body.results.map(fromWireResult);
  }

  async getSeries(symbol: string, window: WindowId): Promise<Series> {
    const body = await this.get<SeriesResponse>(
      `/history?symbol=${encodeURIComponent(symbol)}&window=${window}`,
    );
    return body.series;
  }
}
