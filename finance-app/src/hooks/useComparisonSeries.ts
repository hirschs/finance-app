import { useMemo } from 'react';
import { SYMBOLS } from '../config/companies';
import type { DataError, Series, WindowId } from '../domain/types';
import type { PanelStatus } from '../components/feedback/StatusView';
import type { MarketDataService } from '../services/MarketDataService';
import { useSeries } from './useMarketData';

export interface ComparisonSeries {
  status: PanelStatus;
  error?: DataError;
  /** Companies whose history loaded. */
  series: Series[];
  /** Symbols whose history failed; shown as a note so a gap is never silent. */
  failed: string[];
}

/** History for every tracked company in one window, flattened into what the views render. */
export function useComparisonSeries(service: MarketDataService, window: WindowId): ComparisonSeries {
  const state = useSeries(service, SYMBOLS, window);
  return useMemo((): ComparisonSeries => {
    if (state.status === 'loading') return { status: 'loading', series: [], failed: [] };
    if (state.status === 'error') return { status: 'error', error: state.error, series: [], failed: [] };
    const series = state.data.flatMap((r) => (r.ok ? [r.value] : []));
    const failed = state.data.flatMap((r, i) => (r.ok ? [] : [SYMBOLS[i]]));
    return { status: series.length === 0 ? 'empty' : 'ready', series, failed };
  }, [state]);
}
