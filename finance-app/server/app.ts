import express from 'express';
import type { Express, Response } from 'express';
import { httpStatusFor, toWireError, toWireResult } from '../src/domain/wire';
import type { ErrorResponse, QuotesResponse, SeriesResponse } from '../src/domain/wire';
import { DataError } from '../src/domain/types';
import type { WindowId } from '../src/domain/types';
import { WINDOWS } from '../src/domain/windows';
import type { MarketDataService } from '../src/services/MarketDataService';
import { mapYahooError } from './YahooMarketDataService';

const MAX_SYMBOLS = 10;

function sendError(res: Response, error: DataError): void {
  const body: ErrorResponse = { error: toWireError(error) };
  res.status(httpStatusFor(error.code)).json(body);
}

function isWindowId(value: unknown): value is WindowId {
  return WINDOWS.some((w) => w.id === value);
}

function registerHistory(app: Express, path: string, service: MarketDataService): void {
  app.get(path, async (req, res) => {
    const symbol = typeof req.query.symbol === 'string' ? req.query.symbol.trim().toUpperCase() : '';
    const window = req.query.window;

    if (!symbol) return sendError(res, new DataError('INVALID', 'Missing symbol'));
    if (!isWindowId(window)) {
      return sendError(res, new DataError('INVALID', `window must be one of: ${WINDOWS.map((w) => w.id).join(', ')}`));
    }

    try {
      const series = await service.getSeries(symbol, window);
      const body: SeriesResponse = { series };
      res.json(body);
    } catch (err) {
      sendError(res, mapYahooError(err, symbol));
    }
  });
}

/**
 * The services are injected so tests (and future providers) never touch the network.
 * `lookupService` answers user-chosen tickers at `/api/lookup/history`; it is separate so the
 * tracked-company service can keep its allow-list.
 */
export function createApp(service: MarketDataService, lookupService?: MarketDataService): Express {
  const app = express();

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/quotes', async (req, res) => {
    const param = typeof req.query.symbols === 'string' ? req.query.symbols : '';
    const symbols = param
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    if (symbols.length === 0 || symbols.length > MAX_SYMBOLS) {
      return sendError(res, new DataError('INVALID', `Provide 1-${MAX_SYMBOLS} comma-separated symbols`));
    }

    try {
      const results = await service.getQuotes(symbols);
      const body: QuotesResponse = { results: results.map(toWireResult) };
      res.json(body);
    } catch (err) {
      sendError(res, mapYahooError(err));
    }
  });

  registerHistory(app, '/api/history', service);
  if (lookupService) registerHistory(app, '/api/lookup/history', lookupService);

  return app;
}
