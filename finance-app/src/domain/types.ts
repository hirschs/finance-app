export type WindowId = 'day' | 'week' | 'quarter';

export interface Company {
  symbol: string;
  name: string;
}

export interface Quote {
  symbol: string;
  name: string;
  currency: string;
  price: number;
  change: number;
  changePct: number;
  asOf: number;
}

export interface PricePoint {
  t: number;
  close: number;
}

export interface Series {
  symbol: string;
  window: WindowId;
  points: PricePoint[];
}

export type ErrorCode = 'NOT_FOUND' | 'UPSTREAM' | 'NETWORK' | 'INVALID';

export class DataError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = 'DataError';
    this.code = code;
  }
}

export function toDataError(err: unknown): DataError {
  if (err instanceof DataError) return err;
  return new DataError('NETWORK', err instanceof Error ? err.message : 'Request failed');
}

/** Per-symbol outcome, so one failing ticker never breaks the others. */
export type Result<T> = { ok: true; value: T } | { ok: false; error: DataError };
