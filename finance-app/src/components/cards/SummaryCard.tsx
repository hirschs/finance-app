import type { Tone } from '../../domain/format';

interface SummaryCardProps {
  label: string;
  value: string;
  hint?: string;
  tone?: Tone;
}

/** One headline number with a short caption. Tone colours the value green / red. */
export function SummaryCard({ label, value, hint, tone = 'neutral' }: SummaryCardProps) {
  return (
    <article className="summary" aria-label={label}>
      <p className="summary-label">{label}</p>
      <p className={`summary-value ${tone}`}>{value}</p>
      {hint && <p className="muted">{hint}</p>}
    </article>
  );
}
