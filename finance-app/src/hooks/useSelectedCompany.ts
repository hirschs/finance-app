import { useMemo } from 'react';
import { FOCUS_SYMBOL } from '../config/companies';
import { DataError } from '../domain/types';
import type { Series, WindowId } from '../domain/types';
import type { MarketDataService } from '../services/MarketDataService';
import type { ComparisonSeries } from './useComparisonSeries';
import { useSeries } from './useMarketData';

/** Plain-language message for the user's symbol; never implies data for a different company. */
function describeFailure(error: DataError, symbol: string): DataError {
  switch (error.code) {
    case 'NOT_FOUND':
      return new DataError('NOT_FOUND', `No data available for ${symbol}. Check the symbol and try again.`);
    case 'INVALID':
      return new DataError('INVALID', `"${symbol}" is not a valid ticker symbol.`);
    default:
      return new DataError(error.code, `Could not load ${symbol}: ${error.message}`);
  }
}

/**
 * History for the user's company plus the focus company (IBM) as the reference line.
 * IBM comes from the tracked-company `service`; the user's symbol from `lookupService`.
 * If the user's symbol fails the result is an error, so the chart can never show IBM
 * (or anything else) in its place.
 */
export function useSelectedCompany(
  service: MarketDataService,
  lookupService: MarketDataService,
  symbol: string,
  window: WindowId,
): ComparisonSeries {
  const referenceSymbols = useMemo(() => (symbol === FOCUS_SYMBOL ? [] : [FOCUS_SYMBOL]), [symbol]);
  const selectedSymbols = useMemo(() => [symbol], [symbol]);
  const reference = useSeries(service, referenceSymbols, window);
  const selected = useSeries(lookupService, selectedSymbols, window);

  return useMemo((): ComparisonSeries => {
    if (selected.status === 'loading' || reference.status === 'loading') {
      return { status: 'loading', series: [], failed: [] };
    }
    if (selected.status === 'error') {
      return { status: 'error', error: describeFailure(selected.error, symbol), series: [], failed: [] };
    }
    const chosen = selected.data[0];
    if (!chosen.ok) {
      return { status: 'error', error: describeFailure(chosen.error, symbol), series: [], failed: [] };
    }

    const referenceSeries: Series[] =
      reference.status === 'success' ? reference.data.flatMap((r) => (r.ok ? [r.value] : [])) : [];
    const failed =
      reference.status === 'success'
        ? reference.data.flatMap((r, i) => (r.ok ? [] : [referenceSymbols[i]]))
        : [...referenceSymbols];
    return { status: 'ready', series: [...referenceSeries, chosen.value], failed };
  }, [reference, selected, symbol, referenceSymbols]);
}
