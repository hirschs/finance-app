import { COMPANIES, FOCUS_SYMBOL } from '../../config/companies';
import { formatPct, formatPts, toneFor } from '../../domain/format';
import type { PerformanceSummary } from '../../domain/metrics';
import { SummaryCard } from './SummaryCard';

interface Props {
  summary: PerformanceSummary;
  /** Number of ranked companies, for "rank 2 of 5". */
  total: number;
  /** What the percentages measure, e.g. "vs previous close". */
  basis: string;
}

const focusName = COMPANIES.find((c) => c.symbol === FOCUS_SYMBOL)?.name ?? FOCUS_SYMBOL;

/** Headline numbers for a window: how the focus company did, who led, who lagged. */
export function PerformanceSummaryCards({ summary, total, basis }: Props) {
  const { focus, leader, laggard, peerAverage, vsPeers } = summary;
  return (
    <section aria-label="Summary" className="summary-grid">
      {focus && (
        <SummaryCard
          label={focusName}
          value={formatPct(focus.entry.changePct)}
          hint={`Rank ${focus.rank} of ${total} · ${basis}`}
          tone={toneFor(focus.entry.changePct)}
        />
      )}
      {leader && (
        <SummaryCard
          label="Best performer"
          value={formatPct(leader.changePct)}
          hint={leader.name}
          tone={toneFor(leader.changePct)}
        />
      )}
      {laggard && (
        <SummaryCard
          label="Weakest performer"
          value={formatPct(laggard.changePct)}
          hint={laggard.name}
          tone={toneFor(laggard.changePct)}
        />
      )}
      {vsPeers !== null && peerAverage !== null && (
        <SummaryCard
          label={`${focusName} vs peers`}
          value={formatPts(vsPeers)}
          hint={`Peer average ${formatPct(peerAverage)}`}
          tone={toneFor(vsPeers)}
        />
      )}
    </section>
  );
}
