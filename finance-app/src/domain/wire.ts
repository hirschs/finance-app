import { DataError } from './types';
import type { ErrorCode, Quote, Result, Series } from './types';

/**
 * JSON contract between the proxy server and the browser client.
 * Shared so both sides are checked against the same types.
 */
export interface WireError {
  code: ErrorCode;
  message: string;
}

export type WireResult<T> = { ok: true; value: T } | { ok: false; error: WireError };

/** `results` has the same order as the requested symbols. */
export interface QuotesResponse {
  results: WireResult<Quote>[];
}

export interface SeriesResponse {
  series: Series;
}

export interface ErrorResponse {
  error: WireError;
}

const HTTP_STATUS: Record<ErrorCode, number> = {
  INVALID: 400,
  NOT_FOUND: 404,
  UPSTREAM: 502,
  NETWORK: 502,
};

const ERROR_CODES = Object.keys(HTTP_STATUS) as ErrorCode[];

export function httpStatusFor(code: ErrorCode): number {
  return HTTP_STATUS[code];
}

export function toWireError(error: DataError): WireError {
  return { code: error.code, message: error.message };
}

export function fromWireError(error: WireError): DataError {
  return new DataError(error.code, error.message);
}

export function isWireError(value: unknown): value is WireError {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.message === 'string' && ERROR_CODES.includes(v.code as ErrorCode);
}

export function toWireResult<T>(result: Result<T>): WireResult<T> {
  return result.ok ? result : { ok: false, error: toWireError(result.error) };
}

export function fromWireResult<T>(result: WireResult<T>): Result<T> {
  return result.ok ? result : { ok: false, error: fromWireError(result.error) };
}
