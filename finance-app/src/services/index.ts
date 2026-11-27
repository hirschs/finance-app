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

export const marketData: MarketDataService = createMarketDataService(import.meta.env.VITE_DATA_SOURCE);
