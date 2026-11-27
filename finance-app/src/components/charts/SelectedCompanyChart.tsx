import { FOCUS_SYMBOL } from '../../config/companies';
import type { WindowId } from '../../domain/types';
import { useSelectedCompany } from '../../hooks/useSelectedCompany';
import type { MarketDataService } from '../../services/MarketDataService';
import { FailedSymbolsNote } from '../feedback/FailedSymbolsNote';
import { ChartCard } from './ChartCard';
import { PriceChart } from './PriceChart';

interface SelectedCompanyChartProps {
  /** Tracked-company source, used for the IBM reference line. */
  service: MarketDataService;
  /** Source for the user's symbol. */
  lookupService: MarketDataService;
  symbol: string;
  window: WindowId;
}

/** The user's company against IBM, in the same % change view as the main comparison charts. */
export function SelectedCompanyChart({ service, lookupService, symbol, window }: SelectedCompanyChartProps) {
  const data = useSelectedCompany(service, lookupService, symbol, window);
  const subtitle =
    symbol === FOCUS_SYMBOL
      ? `% change over the selected window for ${symbol}`
      : `${symbol} compared with ${FOCUS_SYMBOL}: % change from the start of the period`;

  return (
    <ChartCard title={`${symbol} comparison`} subtitle={subtitle} status={data.status} error={data.error}>
      <PriceChart series={data.series} window={window} />
      <FailedSymbolsNote symbols={data.failed} />
    </ChartCard>
  );
}
