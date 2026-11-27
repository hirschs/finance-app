// @vitest-environment node
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { DataError } from '../src/domain/types';
import type { MarketDataService } from '../src/services/MarketDataService';
import { createApp } from './app';

const service: MarketDataService = {
  async getQuotes(symbols) {
    return symbols.map((symbol) =>
      symbol === 'BAD'
        ? { ok: false as const, error: new DataError('NOT_FOUND', 'nope') }
        : {
            ok: true as const,
            value: { symbol, name: symbol, currency: 'USD', price: 1, change: 0, changePct: 0, asOf: 1 },
          },
    );
  },
  async getSeries(symbol, window) {
    if (symbol === 'DOWN') throw new DataError('UPSTREAM', 'provider down');
    return { symbol, window, points: [{ t: 1, close: 2 }] };
  },
};

let close: (() => void) | undefined;

async function start(): Promise<string> {
  const server = createApp(service).listen(0);
  await new Promise((r) => server.once('listening', r));
  close = () => server.close();
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

afterEach(() => close?.());

describe('proxy routes', () => {
  it('GET /api/health', async () => {
    const res = await fetch(`${await start()}/api/health`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  it('GET /api/quotes returns per-symbol results in order, upper-casing input', async () => {
    const res = await fetch(`${await start()}/api/quotes?symbols=ibm,bad`);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.results[0]).toMatchObject({ ok: true, value: { symbol: 'IBM' } });
    expect(body.results[1]).toEqual({ ok: false, error: { code: 'NOT_FOUND', message: 'nope' } });
  });

  it('GET /api/quotes validates the symbols parameter', async () => {
    const base = await start();
    expect((await fetch(`${base}/api/quotes`)).status).toBe(400);
    const tooMany = Array.from({ length: 11 }, (_, i) => `S${i}`).join(',');
    expect((await fetch(`${base}/api/quotes?symbols=${tooMany}`)).status).toBe(400);
  });

  it('GET /api/history returns a series', async () => {
    const res = await fetch(`${await start()}/api/history?symbol=IBM&window=week`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ series: { symbol: 'IBM', window: 'week', points: [{ t: 1, close: 2 }] } });
  });

  it('GET /api/history rejects a missing symbol or unknown window with 400', async () => {
    const base = await start();
    expect((await fetch(`${base}/api/history?window=day`)).status).toBe(400);
    const res = await fetch(`${base}/api/history?symbol=IBM&window=year`);
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe('INVALID');
  });

  it('GET /api/history maps provider errors to HTTP status codes', async () => {
    const res = await fetch(`${await start()}/api/history?symbol=DOWN&window=day`);
    expect(res.status).toBe(502);
    expect((await res.json()).error).toEqual({ code: 'UPSTREAM', message: 'provider down' });
  });
});
