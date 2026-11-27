import { describe, expect, it } from 'vitest';
import { WINDOW_QUERY } from '../../server/windowQuery';
import { DEFAULT_WINDOW, WINDOWS, getWindow } from '../domain/windows';
import { COMPANIES, FOCUS_SYMBOL, SYMBOLS } from './companies';

describe('company config', () => {
  it('tracks IBM plus at most four competitors, with unique symbols', () => {
    expect(COMPANIES.length).toBeGreaterThanOrEqual(1);
    expect(COMPANIES.length).toBeLessThanOrEqual(5);
    expect(new Set(SYMBOLS).size).toBe(SYMBOLS.length);
  });

  it('includes the focus company and derives SYMBOLS in display order', () => {
    expect(SYMBOLS).toContain(FOCUS_SYMBOL);
    expect(SYMBOLS).toEqual(COMPANIES.map((c) => c.symbol));
  });

  it('uses upper-case ticker symbols', () => {
    for (const s of SYMBOLS) expect(s).toMatch(/^[A-Z.\-^]{1,10}$/);
  });
});

describe('window config', () => {
  it('offers day, week and quarter, opening on the current day', () => {
    expect(WINDOWS.map((w) => w.id)).toEqual(['day', 'week', 'quarter']);
    expect(DEFAULT_WINDOW).toBe('day');
  });

  it('looks windows up by id', () => {
    expect(getWindow('week').label).toBe('7 Days');
  });

  it('has a proxy query for every window, with sensible bounds', () => {
    for (const { id } of WINDOWS) {
      const q = WINDOW_QUERY[id];
      expect(q.lookbackMs).toBeGreaterThan(0);
      expect(q.ttlMs).toBeGreaterThan(0);
    }
    expect(WINDOW_QUERY.quarter.lookbackMs).toBeGreaterThan(WINDOW_QUERY.week.lookbackMs);
    expect(WINDOW_QUERY.week.lookbackMs).toBeGreaterThanOrEqual(7 * 86_400_000);
  });
});
