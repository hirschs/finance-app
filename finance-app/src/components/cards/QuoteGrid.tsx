import type { AsyncState } from '../../hooks/useAsync';
import type { Quote, Result } from '../../domain/types';
import { ErrorPanel, Loading } from '../feedback/StatusView';
import { QuoteCard } from './QuoteCard';

interface QuoteGridProps {
  state: AsyncState<Result<Quote>[]>;
  /** Same order as the results, used to label cards whose quote failed. */
  symbols: string[];
}

/** One card per company. A failed ticker shows its own error without hiding the others. */
export function QuoteGrid({ state, symbols }: QuoteGridProps) {
  return (
    <section aria-label="Current quotes" className="quote-grid">
      {state.status === 'loading' && <Loading label="Loading quotes…" />}
      {state.status === 'error' && <ErrorPanel error={state.error} />}
      {state.status === 'success' &&
        state.data.map((r, i) =>
          r.ok ? (
            <QuoteCard key={symbols[i]} quote={r.value} />
          ) : (
            <article key={symbols[i]} className="quote">
              <h3>{symbols[i]}</h3>
              <ErrorPanel error={r.error} />
            </article>
          ),
        )}
    </section>
  );
}
