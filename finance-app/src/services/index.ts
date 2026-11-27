import { HttpMarketDataService } from './HttpMarketDataService';
import type { MarketDataService } from './MarketDataService';
import { MockMarketDataService } from './MockMarketDataService';

export type { MarketDataService } from './MarketDataService';

/**
 * Single place that decides which data source the app uses.
 * `VITE_DATA_SOURCE=mock` selects deterministic sample data (offline demos);
 * anything else uses the Yahoo Finance proxy at `/api`.
 */
export function createMarketDataService(source: string | undefined): MarketDataService {
  return source === 'mock' ? new MockMarketDataService() : new HttpMarketDataService();
}

/** Extra tickers the offline mock can serve for the user-selected chart; anything else is "no data". */
const MOCK_LOOKUP_SYMBOLS = ['AAPL', 'GOOGL', 'AMZN', 'TSLA'];

/**
 * Data source for the user-selected company. The proxy serves any well-formed ticker on
 * `/api/lookup`, while the tracked-company dashboards keep their fixed list on `/api`.
 */
export function createLookupService(source: string | undefined): MarketDataService {
  return source === 'mock'
    ? new MockMarketDataService(Date.now, 150, MOCK_LOOKUP_SYMBOLS)
    : new HttpMarketDataService('/api/lookup');
}

export const marketData: MarketDataService = createMarketDataService(import.meta.env.VITE_DATA_SOURCE);
export const lookupData: MarketDataService = createLookupService(import.meta.env.VITE_DATA_SOURCE);
