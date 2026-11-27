import { describe, expect, it } from 'vitest';
import { formatPct, formatPts, toneFor } from './format';

describe('format', () => {
  it('signs positive percentages and never shows "+0.00%" or "-0.00%"-style noise for zero', () => {
    expect(formatPct(1.234)).toBe('+1.23%');
    expect(formatPct(-0.4)).toBe('-0.40%');
    expect(formatPct(0)).toBe('0.00%');
    expect(formatPct(0.001)).toBe('0.00%');
  });

  it('formats percentage-point gaps', () => {
    expect(formatPts(1.26)).toBe('+1.3 pts');
    expect(formatPts(-2)).toBe('-2.0 pts');
  });

  it('picks a tone from the sign', () => {
    expect(toneFor(1)).toBe('up');
    expect(toneFor(-1)).toBe('down');
    expect(toneFor(0)).toBe('neutral');
  });
});
