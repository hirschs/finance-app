import { FOCUS_SYMBOL } from '../../config/companies';
import { toneFor } from '../../domain/format';
import type { Quote } from '../../domain/types';

export function QuoteCard({ quote }: { quote: Quote }) {
  const tone = toneFor(quote.change);
  const sign = quote.change > 0 ? '+' : '';
  const focus = quote.symbol === FOCUS_SYMBOL;
  return (
    <article className={focus ? 'quote focus' : 'quote'} aria-label={`${quote.name} quote`}>
      <h3>
        {quote.symbol}
        {quote.name !== quote.symbol && <span className="muted"> {quote.name}</span>}
      </h3>
      <p className="price">
        {quote.price.toFixed(2)} <span className="muted">{quote.currency}</span>
      </p>
      <p className={tone}>
        {sign}
        {quote.change.toFixed(2)} ({sign}
        {quote.changePct.toFixed(2)}%)
      </p>
    </article>
  );
}
