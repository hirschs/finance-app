const STEPS = [0.5, 1, 2, 5, 10, 20, 50];

/**
 * Symmetric axis around 0 with explicit clean ticks (0 is always one of them).
 * ~30% headroom keeps value labels at the end of the longest bars inside the plot.
 */
export function barAxis(values: number[]): { domain: [number, number]; ticks: number[]; step: number } {
  const extent = Math.max(0.5, ...values.map(Math.abs)) * 1.3;
  const step = STEPS.find((s) => extent / s <= 3) ?? 100;
  const bound = Math.ceil(extent / step) * step;
  const ticks: number[] = [];
  for (let t = -bound; t <= bound + step / 2; t += step) ticks.push(Math.round(t * 100) / 100);
  return { domain: [-bound, bound], ticks, step };
}
