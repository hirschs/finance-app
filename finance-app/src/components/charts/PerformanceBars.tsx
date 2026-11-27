import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatPct } from '../../domain/format';
import { barAxis } from './barAxis';
import type { PerformanceEntry } from '../../domain/metrics';

const UP = '#198038';
const DOWN = '#da1e28';

/** Horizontal bars of % change per company, best first. Green = up, red = down. */
export function PerformanceBars({ entries }: { entries: PerformanceEntry[] }) {
  const { domain, ticks, step } = barAxis(entries.map((e) => e.changePct));
  const decimals = step < 1 ? 1 : 0;
  return (
    <div style={{ width: '100%', height: Math.max(160, entries.length * 48) }}>
      <ResponsiveContainer>
        <BarChart data={entries} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <XAxis
            type="number"
            domain={domain}
            ticks={ticks}
            tickFormatter={(v: number) => `${v.toFixed(decimals)}%`}
          />
          <YAxis type="category" dataKey="symbol" width={56} />
          <ReferenceLine x={0} stroke="#8d8d8d" />
          <Tooltip
            formatter={(v: number) => formatPct(v)}
            labelFormatter={(symbol: string) => entries.find((e) => e.symbol === symbol)?.name ?? symbol}
          />
          <Bar dataKey="changePct" isAnimationActive={false}>
            {entries.map((e) => (
              <Cell key={e.symbol} fill={e.changePct >= 0 ? UP : DOWN} />
            ))}
            <LabelList dataKey="changePct" position="right" formatter={(v: number) => formatPct(v)} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
