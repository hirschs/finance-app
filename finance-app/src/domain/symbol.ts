/** Shape of a ticker the app will request: letters/digits, with `.` or `-` for share classes (BRK-B). */
export const SYMBOL_PATTERN = /^[A-Z0-9][A-Z0-9.-]{0,11}$/;

/** Trims and upper-cases user input; does not validate. */
export function normalizeSymbol(input: string): string {
  return input.trim().toUpperCase();
}

export function isValidSymbol(symbol: string): boolean {
  return SYMBOL_PATTERN.test(symbol);
}
