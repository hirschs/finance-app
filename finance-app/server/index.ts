import { createApp } from './app';
import { YahooMarketDataService } from './YahooMarketDataService';
import { createYahooClient } from './yahooClient';

const port = Number(process.env.PORT ?? 3001);
const app = createApp(new YahooMarketDataService({ client: createYahooClient() }));

app.listen(port, () => {
  console.log(`Market data proxy listening on http://localhost:${port}`);
});
