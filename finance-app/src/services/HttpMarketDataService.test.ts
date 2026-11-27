import { describe, expect, it, vi } from 'vitest';
import { HttpMarketDataService } from './HttpMarketDataService';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function make(fetchFn: typeof fetch) {
  return new HttpMarketDataService('/api', fetchFn);
}

describe('HttpMarketDataService', () => {
  it('requests quotes and revives per-symbol error results as DataError', async () => {
    const fetchFn = vi.fn(async () =>
      jsonResponse({
        results: [
          { ok: true, value: { symbol: 'IBM', name: 'IBM', currency: 'USD', price: 1, change: 0, changePct: 0, asOf: 1 } },
          { ok: false, error: { code: 'NOT_FOUND', message: 'nope' } },
        ],
      }),
    );
    const results = await make(fetchFn as never).getQuotes(['IBM', 'BAD']);

    expect(fetchFn).toHaveBeenCalledWith('/api/quotes?symbols=IBM%2CBAD');
    expect(results[0].ok).toBe(true);
    expect(!results[1].ok && results[1].error.code).toBe('NOT_FOUND');
  });

  it('requests history and returns the series', async () => {
    const series = { symbol: 'IBM', window: 'week', points: [{ t: 1, close: 2 }] };
    const fetchFn = vi.fn(async () => jsonResponse({ series }));
    expect(await make(fetchFn as never).getSeries('IBM', 'week')).toEqual(series);
    expect(fetchFn).toHaveBeenCalledWith('/api/history?symbol=IBM&window=week');
  });

  it('throws the typed error the server sent', async () => {
    const fetchFn = async () => jsonResponse({ error: { code: 'NOT_FOUND', message: 'No data' } }, 404);
    await expect(make(fetchFn as never).getSeries('IBM', 'day')).rejects.toMatchObject({
      name: 'DataError',
      code: 'NOT_FOUND',
      message: 'No data',
    });
  });

  it('maps a network failure to NETWORK', async () => {
    const fetchFn = async () => {
      throw new TypeError('Failed to fetch');
    };
    await expect(make(fetchFn as never).getSeries('IBM', 'day')).rejects.toMatchObject({ code: 'NETWORK' });
  });

  it('maps a non-JSON or unrecognised error body to UPSTREAM', async () => {
    const html = async () => new Response('<html>Bad gateway</html>', { status: 502 });
    await expect(make(html as never).getSeries('IBM', 'day')).rejects.toMatchObject({ code: 'UPSTREAM' });

    const odd = async () => jsonResponse({ oops: true }, 500);
    await expect(make(odd as never).getSeries('IBM', 'day')).rejects.toMatchObject({ code: 'UPSTREAM' });
  });
});
