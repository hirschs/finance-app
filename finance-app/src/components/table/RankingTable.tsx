import { FOCUS_SYMBOL } from '../../config/companies';
import { formatPct, toneFor } from '../../domain/format';
import type { PerformanceEntry } from '../../domain/metrics';

/** Text equivalent of the charts: ranked companies with their change over the window. */
export function RankingTable({ entries, caption }: { entries: PerformanceEntry[]; caption: string }) {
  return (
    <table className="ranking">
      <caption className="visually-hidden">{caption}</caption>
      <thead>
        <tr>
          <th scope="col">Rank</th>
          <th scope="col">Company</th>
          <th scope="col" className="num">
            Change
          </th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e, i) => (
          <tr key={e.symbol} className={e.symbol === FOCUS_SYMBOL ? 'focus' : undefined}>
            <td>{i + 1}</td>
            <th scope="row">
              {e.name}
              {e.name !== e.symbol && <span className="muted"> {e.symbol}</span>}
            </th>
            <td className={`num ${toneFor(e.changePct)}`}>{formatPct(e.changePct)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
