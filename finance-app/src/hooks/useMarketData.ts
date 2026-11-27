import { useCallback } from 'react';
import { toDataError } from '../domain/types';
import type { Quote, Result, Series, WindowId } from '../domain/types';
import type { MarketDataService } from '../services/MarketDataService';
import { useAsync } from './useAsync';
import type { AsyncState } from './useAsync';

/** `symbols` must be a stable reference (memoize it in the caller). */
export function useQuotes(
  service: MarketDataService,
  symbols: string[],
): AsyncState<Result<Quote>[]> {
  const load = useCallback(() => service.getQuotes(symbols), [service, symbols]);
  return useAsync(load);
}

/** Loads one series per symbol; a failed symbol yields an error Result, not a failed hook. */
export function useSeries(
  service: MarketDataService,
  symbols: string[],
  window: WindowId,
): AsyncState<Result<Series>[]> {
  const load = useCallback(
    () =>
      Promise.all(
        symbols.map(
          (symbol): Promise<Result<Series>> =>
            service.getSeries(symbol, window).then(
              (value) => ({ ok: true, value }),
              (err: unknown) => ({ ok: false, error: toDataError(err) }),
            ),
        ),
      ),
    [service, symbols, window],
  );
  return useAsync(load);
}
