import { COMPANIES } from '../../config/companies';

const SERIES_COLORS = ['#0f62fe', '#8a3ffc', '#009d9a', '#d12771', '#b28600'];

/** Reserved for a user-selected company, so it never borrows a tracked company's colour. */
const SELECTED_COLOR = '#ff832b';

/** Colour is tied to the company's position in config, so it stays stable if another ticker fails to load. */
export function colorForSymbol(symbol: string): string {
  const index = COMPANIES.findIndex((c) => c.symbol === symbol);
  return index < 0 ? SELECTED_COLOR : SERIES_COLORS[index % SERIES_COLORS.length];
}
