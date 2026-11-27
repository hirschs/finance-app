import { COMPANIES } from '../../config/companies';

const SERIES_COLORS = ['#0f62fe', '#8a3ffc', '#009d9a', '#d12771', '#b28600'];

/** Colour is tied to the company's position in config, so it stays stable if another ticker fails to load. */
export function colorForSymbol(symbol: string): string {
  const index = COMPANIES.findIndex((c) => c.symbol === symbol);
  return SERIES_COLORS[(index < 0 ? 0 : index) % SERIES_COLORS.length];
}
