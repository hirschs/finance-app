import type { Company } from '../domain/types';

/** IBM plus up to four competitors. Add or swap entries here; nothing else needs to change. */
export const COMPANIES: readonly Company[] = [
  { symbol: 'IBM', name: 'IBM' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'ORCL', name: 'Oracle' },
  { symbol: 'SAP', name: 'SAP' },
  { symbol: 'CRM', name: 'Salesforce' },
];

/** The company everything else is compared against. */
export const FOCUS_SYMBOL = 'IBM';

/** Tickers in display order; a stable reference, safe to pass to data hooks. */
export const SYMBOLS: string[] = COMPANIES.map((c) => c.symbol);
