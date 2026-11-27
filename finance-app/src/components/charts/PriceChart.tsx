import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toChartRows } from '../../domain/metrics';
import type { Series, WindowId } from '../../domain/types';
import { FOCUS_SYMBOL } from '../../config/companies';
import { colorForSymbol } from './chartTheme';

interface PriceChartProps {
  series: Series[];
  window: WindowId;
}

function formatTick(t: number, window: WindowId): string {
  const d = new Date(t);
  if (window === 'day') return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  // Weekday alone repeats (several ticks per day), so include the hour to keep labels distinct.
  if (window === 'week') return d.toLocaleString([], { weekday: 'short', hour: 'numeric' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/**
 * Relative-performance comparison: every series is rebased to % change from its
 * first point so tickers with very different prices share one axis.
 * This is the only file that imports the charting library.
 */
export function PriceChart({ series, window }: PriceChartProps) {
  const rows = toChartRows(series);
  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer>
        <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="t" tickFormatter={(t: number) => formatTick(t, window)} minTickGap={32} />
          <YAxis tickFormatter={(v: number) => `${v.toFixed(1)}%`} width={68} />
          <Tooltip
            labelFormatter={(t: number) => new Date(t).toLocaleString()}
            formatter={(v: number) => `${v.toFixed(2)}%`}
          />
          <Legend />
          {series.map((s) => (
            <Line
              key={s.symbol}
              type="monotone"
              dataKey={s.symbol}
              stroke={colorForSymbol(s.symbol)}
              strokeWidth={s.symbol === FOCUS_SYMBOL ? 3 : 1.5}
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
