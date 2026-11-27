import { describe, expect, it } from 'vitest';
import { isValidSymbol, normalizeSymbol } from './symbol';

describe('symbol helpers', () => {
  it('trims and upper-cases input', () => {
    expect(normalizeSymbol('  aapl ')).toBe('AAPL');
  });

  it('accepts plausible tickers, including share classes', () => {
    for (const s of ['IBM', 'BRK-B', 'BF.B', '005930.KS']) expect(isValidSymbol(s)).toBe(true);
  });

  it('rejects empty, spaced, symbol-laden or overlong input', () => {
    for (const s of ['', 'A B', '../etc', '-IBM', 'ABCDEFGHIJKLM', 'ib$m']) expect(isValidSymbol(s)).toBe(false);
  });
});
