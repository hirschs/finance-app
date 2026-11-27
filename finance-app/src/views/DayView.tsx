import { useMemo } from 'react';
import { PerformanceSummaryCards } from '../components/cards/PerformanceSummaryCards';
import { QuoteGrid } from '../components/cards/QuoteGrid';
import { ChartCard } from '../components/charts/ChartCard';
import { PerformanceBars } from '../components/charts/PerformanceBars';
import { PriceChart } from '../components/charts/PriceChart';
import { FailedSymbolsNote } from '../components/feedback/FailedSymbolsNote';
import type { PanelStatus } from '../components/feedback/StatusView';
import { FOCUS_SYMBOL, SYMBOLS } from '../config/companies';
import { rankPerformance, summarize } from '../domain/metrics';
import type { PerformanceEntry } from '../domain/metrics';
import { useComparisonSeries } from '../hooks/useComparisonSeries';
import { useQuotes } from '../hooks/useMarketData';
import type { MarketDataService } from '../services/MarketDataService';

/** Current-day market summary: today's move per company, plus the intraday shape. */
export function DayView({ service }: { service: MarketDataService }) {
  const quotes = useQuotes(service, SYMBOLS);
  const intraday = useComparisonSeries(service, 'day');

  // Daily change as reported by the market (vs previous close).
  const entries = useMemo((): PerformanceEntry[] => {
    if (quotes.status !== 'success') return [];
    return rankPerformance(
      quotes.data.flatMap((r) =>
        r.ok ? [{ symbol: r.value.symbol, name: r.value.name, changePct: r.value.changePct }] : [],
      ),
    );
  }, [quotes]);
  const summary = useMemo(() => summarize(entries, FOCUS_SYMBOL), [entries]);
  const moversStatus: PanelStatus =
    quotes.status !== 'success' ? quotes.status : entries.length === 0 ? 'empty' : 'ready';

  return (
    <div className="stack">
      {entries.length > 0 && (
        <PerformanceSummaryCards summary={summary} total={entries.length} basis="vs previous close" />
      )}
      <QuoteGrid state={quotes} symbols={SYMBOLS} />

      <ChartCard
        title="Today, session so far"
        subtitle="% change since the session opened (latest trading day)"
        status={intraday.status}
        error={intraday.error}
      >
        <PriceChart series={intraday.series} window="day" />
        <FailedSymbolsNote symbols={intraday.failed} />
      </ChartCard>

      <ChartCard
        title="Today's movers"
        subtitle="% change vs previous close"
        status={moversStatus}
        error={quotes.status === 'error' ? quotes.error : undefined}
      >
        <PerformanceBars entries={entries} />
      </ChartCard>
    </div>
  );
}
