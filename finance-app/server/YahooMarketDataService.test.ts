// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import type { RawChart, RawQuote } from '../src/domain/normalize';
import { YahooMarketDataService } from './YahooMarketDataService';
import type { YahooClient } from './yahooClient';

const T = Date.UTC(2025, 0, 15, 15, 0, 0);
const COMPANIES = [
  { symbol: 'IBM', name: 'IBM' },
  { symbol: 'MSFT', name: 'Microsoft' },
];

function quote(symbol: string, price: number): RawQuote {
  return { symbol, regularMarketPrice: price, regularMarketChange: 1, regularMarketChangePercent: 0.5, regularMarketTime: T };
}

function fakeClient(overrides: Partial<YahooClient> = {}): YahooClient & { quote: ReturnType<typeof vi.fn>; chart: ReturnType<typeof vi.fn> } {
  const chart: RawChart = { quotes: [{ date: T, close: 10 }, { date: T + 60_000, close: 11 }] };
  return {
    quote: vi.fn(async (symbols: string[]) => symbols.map((s) => quote(s, 100))),
    chart: vi.fn(async () => chart),
    ...overrides,
  } as never;
}

function make(client: YahooClient, now = () => T) {
  return new YahooMarketDataService({ client, companies: COMPANIES, now });
}

describe('YahooMarketDataService.getQuotes', () => {
  it('names an unlisted symbol from Yahoo when lookups are allowed', async () => {
    const client = fakeClient({ quote: vi.fn(async () => [{ ...quote('TSLA', 100), shortName: 'Tesla, Inc.' }]) });
    const svc = new YahooMarketDataService({ client, companies: COMPANIES, allowUnlisted: true, now: () => T });
    const [result] = await svc.getQuotes(['TSLA']);
    expect(result.ok && result.value.name).toBe('Tesla, Inc.');
  });

  it('returns normalized quotes with configured display names, in request order', async () => {
    const results = await make(fakeClient()).getQuotes(['MSFT', 'IBM']);
    expect(results.map((r) => (r.ok ? r.value.name : null))).toEqual(['Microsoft', 'IBM']);
  });

  it('isolates bad symbols without failing the batch or calling Yahoo for them', async () => {
    const client = fakeClient();
    const results = await make(client).getQuotes(['IBM', 'bad symbol!', 'TSLA']);
    expect(results[0].ok).toBe(true);
    expect(!results[1].ok && results[1].error.code).toBe('INVALID');
    expect(!results[2].ok && results[2].error.code).toBe('NOT_FOUND');
    expect(client.quote).toHaveBeenCalledWith(['IBM']);
  });

  it('marks a tracked symbol missing from Yahoo response as NOT_FOUND', async () => {
    const client = fakeClient({ quote: vi.fn(async () => [quote('IBM', 100)]) });
    const results = await make(client).getQuotes(['IBM', 'MSFT']);
    expect(results[0].ok).toBe(true);
    expect(!results[1].ok && results[1].error.code).toBe('NOT_FOUND');
  });

  it('turns a provider failure into per-symbol UPSTREAM errors', async () => {
    const client = fakeClient({ quote: vi.fn(async () => { throw new Error('boom'); }) });
    const results = await make(client).getQuotes(['IBM', 'MSFT']);
    expect(results.every((r) => !r.ok && r.error.code === 'UPSTREAM')).toBe(true);
  });

  it('caches within the TTL and serves stale data when a refresh fails', async () => {
    let now = T;
    const client = fakeClient();
    const svc = make(client, () => now);

    await svc.getQuotes(['IBM']);
    await svc.getQuotes(['IBM']);
    expect(client.quote).toHaveBeenCalledTimes(1);

    now += 10 * 60_000;
    client.quote.mockRejectedValueOnce(new Error('down'));
    const stale = await svc.getQuotes(['IBM']);
    expect(client.quote).toHaveBeenCalledTimes(2);
    expect(stale[0].ok).toBe(true);
  });
});

describe('YahooMarketDataService.getSeries', () => {
  it('requests the interval and lookback configured for the window', async () => {
    const client = fakeClient();
    await make(client).getSeries('IBM', 'quarter');
    const [, request] = client.chart.mock.calls[0];
    expect(request.interval).toBe('1d');
    expect(request.period1.getTime()).toBe(T - 90 * 86_400_000);
  });

  it('returns a normalized series', async () => {
    const s = await make(fakeClient()).getSeries('IBM', 'week');
    expect(s).toEqual({
      symbol: 'IBM',
      window: 'week',
      points: [{ t: T, close: 10 }, { t: T + 60_000, close: 11 }],
    });
  });

  it('serves unlisted symbols only when allowUnlisted is set, still rejecting malformed ones', async () => {
    const client = fakeClient();
    const svc = new YahooMarketDataService({ client, companies: COMPANIES, allowUnlisted: true, now: () => T });
    expect((await svc.getSeries('TSLA', 'day')).symbol).toBe('TSLA');
    await expect(svc.getSeries('../etc', 'day')).rejects.toMatchObject({ code: 'INVALID' });
  });

  it('still reports NOT_FOUND for an unlisted symbol Yahoo has no data for', async () => {
    const client = fakeClient({ chart: vi.fn(async () => { throw new Error('No data found, symbol may be delisted'); }) });
    const svc = new YahooMarketDataService({ client, companies: COMPANIES, allowUnlisted: true, now: () => T });
    await expect(svc.getSeries('ZZZZ', 'day')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('rejects invalid and untracked symbols without calling Yahoo', async () => {
    const client = fakeClient();
    const svc = make(client);
    await expect(svc.getSeries('../etc', 'day')).rejects.toMatchObject({ code: 'INVALID' });
    await expect(svc.getSeries('TSLA', 'day')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(client.chart).not.toHaveBeenCalled();
  });

  it('maps "No data found" to NOT_FOUND and other failures to UPSTREAM', async () => {
    const noData = fakeClient({ chart: vi.fn(async () => { throw new Error('No data found, symbol may be delisted'); }) });
    await expect(make(noData).getSeries('IBM', 'day')).rejects.toMatchObject({ code: 'NOT_FOUND' });

    const down = fakeClient({ chart: vi.fn(async () => { throw new Error('ECONNRESET'); }) });
    await expect(make(down).getSeries('IBM', 'day')).rejects.toMatchObject({ code: 'UPSTREAM' });
  });

  it('treats an empty series as NOT_FOUND', async () => {
    const client = fakeClient({ chart: vi.fn(async () => ({ quotes: [] })) });
    await expect(make(client).getSeries('IBM', 'day')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
