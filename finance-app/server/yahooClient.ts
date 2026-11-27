import YahooFinance from 'yahoo-finance2';
import type { RawChart, RawQuote } from '../src/domain/normalize';

export type ChartInterval = '5m' | '30m' | '1d';

export interface ChartRequest {
  period1: Date;
  interval: ChartInterval;
}

/**
 * The only seam to Yahoo Finance. If Yahoo access breaks or the provider changes,
 * this is the single file to replace; everything downstream sees RawQuote / RawChart.
 */
export interface YahooClient {
  quote(symbols: string[]): Promise<RawQuote[]>;
  chart(symbol: string, request: ChartRequest): Promise<RawChart>;
}

export function createYahooClient(): YahooClient {
  const yahoo = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

  // validateResult:false tolerates Yahoo adding or changing fields; normalize.ts checks what it needs.
  return {
    async quote(symbols) {
      return (await yahoo.quote(symbols, {}, { validateResult: false })) as RawQuote[];
    },
    async chart(symbol, { period1, interval }) {
      return (await yahoo.chart(
        symbol,
        { period1, interval, includePrePost: false },
        { validateResult: false },
      )) as RawChart;
    },
  };
}
