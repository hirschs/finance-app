import { useMemo } from 'react';
import { PerformanceSummaryCards } from '../components/cards/PerformanceSummaryCards';
import { ChartCard } from '../components/charts/ChartCard';
import { PerformanceBars } from '../components/charts/PerformanceBars';
import { PriceChart } from '../components/charts/PriceChart';
import { FailedSymbolsNote } from '../components/feedback/FailedSymbolsNote';
import { RankingTable } from '../components/table/RankingTable';
import { COMPANIES, FOCUS_SYMBOL } from '../config/companies';
import { seriesPerformance, summarize } from '../domain/metrics';
import type { WindowId } from '../domain/types';
import { useComparisonSeries } from '../hooks/useComparisonSeries';
import type { MarketDataService } from '../services/MarketDataService';

interface TrendViewProps {
  service: MarketDataService;
  window: Exclude<WindowId, 'day'>;
}

const COPY: Record<TrendViewProps['window'], { chart: string; ranking: string; basis: string }> = {
  week: {
    chart: '7-day trend comparison',
    ranking: 'Performance over the last 7 days',
    basis: 'last 7 days',
  },
  quarter: {
    chart: 'Quarter comparison',
    ranking: 'Performance over the last quarter',
    basis: 'last quarter',
  },
};

/** Shared by the 7-day and quarter views: relative-performance lines, a ranking, and headline cards. */
export function TrendView({ service, window }: TrendViewProps) {
  const copy = COPY[window];
  const data = useComparisonSeries(service, window);
  const entries = useMemo(() => seriesPerformance(data.series, COMPANIES), [data.series]);
  const summary = useMemo(() => summarize(entries, FOCUS_SYMBOL), [entries]);
  const rankingStatus = data.status === 'ready' && entries.length === 0 ? 'empty' : data.status;

  return (
    <div className="stack">
      {entries.length > 0 && (
        <PerformanceSummaryCards summary={summary} total={entries.length} basis={copy.basis} />
      )}

      <ChartCard
        title={copy.chart}
        subtitle="% change from the start of the period, so companies with different share prices compare fairly"
        status={data.status}
        error={data.error}
      >
        <PriceChart series={data.series} window={window} />
        <FailedSymbolsNote symbols={data.failed} />
      </ChartCard>

      <ChartCard title="Ranking" subtitle={copy.ranking} status={rankingStatus} error={data.error}>
        <PerformanceBars entries={entries} />
        <RankingTable entries={entries} caption={copy.ranking} />
      </ChartCard>
    </div>
  );
}
