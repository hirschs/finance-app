import { describe, expect, it } from 'vitest';
import { barAxis } from './barAxis';

describe('barAxis', () => {
  it('is symmetric around zero and always has a 0 tick', () => {
    for (const values of [[1.2, -0.4], [-39.1, 5], [0.1], [], [12, 8, -3]]) {
      const { domain, ticks } = barAxis(values);
      expect(domain[0]).toBe(-domain[1]);
      expect(ticks).toContain(0);
      expect(ticks[0]).toBe(domain[0]);
      expect(ticks[ticks.length - 1]).toBe(domain[1]);
    }
  });

  it('leaves headroom beyond the largest value', () => {
    const { domain } = barAxis([-39.1, 5]);
    expect(domain[1]).toBeGreaterThan(39.1 * 1.25);
  });

  it('keeps the tick count small', () => {
    expect(barAxis([-39.1, 5]).ticks.length).toBeLessThanOrEqual(9);
  });
});
