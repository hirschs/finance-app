import type { Quote, Result, Series, WindowId } from '../domain/types';

/**
 * The only contract the UI depends on. Swap implementations (mock, HTTP proxy
 * over Yahoo Finance, ...) in `services/index.ts` without touching components.
 */
export interface MarketDataService {
  getQuotes(symbols: string[]): Promise<Result<Quote>[]>;
  getSeries(symbol: string, window: WindowId): Promise<Series>;
}
