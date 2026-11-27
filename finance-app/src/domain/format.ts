export type Tone = 'up' | 'down' | 'neutral';

/** "+1.23%" / "-0.40%" / "0.00%". */
export function formatPct(value: number, digits = 2): string {
  const text = value.toFixed(digits);
  return value > 0 && Number(text) !== 0 ? `+${text}%` : `${text}%`;
}

/** Percentage-point difference, e.g. "+1.3 pts". */
export function formatPts(value: number, digits = 1): string {
  const text = value.toFixed(digits);
  return value > 0 && Number(text) !== 0 ? `+${text} pts` : `${text} pts`;
}

export function toneFor(value: number): Tone {
  if (value > 0) return 'up';
  if (value < 0) return 'down';
  return 'neutral';
}
