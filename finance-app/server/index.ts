import { createApp } from './app';
import { YahooMarketDataService } from './YahooMarketDataService';
import { createYahooClient } from './yahooClient';

const port = Number(process.env.PORT ?? 3001);
const client = createYahooClient();
const app = createApp(
  new YahooMarketDataService({ client }),
  // User-chosen tickers: any well-formed symbol, with bounded caches.
  new YahooMarketDataService({ client, allowUnlisted: true, maxCacheEntries: 200 }),
);

app.listen(port, () => {
  console.log(`Market data proxy listening on http://localhost:${port}`);
});
