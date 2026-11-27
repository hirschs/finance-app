import { describe, expect, it } from 'vitest';
import { DataError, toDataError } from './types';

describe('toDataError', () => {
  it('returns an existing DataError unchanged', () => {
    const original = new DataError('NOT_FOUND', 'no such symbol');
    expect(toDataError(original)).toBe(original);
  });

  it('wraps a plain Error as NETWORK, keeping its message', () => {
    const err = toDataError(new Error('socket hang up'));
    expect(err).toBeInstanceOf(DataError);
    expect(err.code).toBe('NETWORK');
    expect(err.message).toBe('socket hang up');
  });

  it('wraps non-Error values with a generic message', () => {
    const err = toDataError('boom');
    expect(err.code).toBe('NETWORK');
    expect(err.message).toBe('Request failed');
  });
});
