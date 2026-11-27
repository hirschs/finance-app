import { useState } from 'react';
import { SelectedCompanyChart } from '../components/charts/SelectedCompanyChart';
import { SymbolSearch } from '../components/controls/SymbolSearch';
import { WindowTabs } from '../components/controls/WindowTabs';
import { DEFAULT_WINDOW } from '../domain/windows';
import type { WindowId } from '../domain/types';
import { lookupData, marketData } from '../services';
import type { MarketDataService } from '../services';
import { DayView } from '../views/DayView';
import { TrendView } from '../views/TrendView';

interface DashboardPageProps {
  service?: MarketDataService;
  /** Source for the user-selected company; the tracked-company dashboards never use it. */
  lookupService?: MarketDataService;
}

export function DashboardPage({ service = marketData, lookupService = lookupData }: DashboardPageProps) {
  const [window, setWindow] = useState<WindowId>(DEFAULT_WINDOW);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <main className="page">
      <header className="page-header">
        <h1>Market Dashboard</h1>
        <p className="muted">IBM compared with major competitors</p>
        <WindowTabs value={window} onChange={setWindow} />
        <SymbolSearch value={selected} onSubmit={setSelected} onClear={() => setSelected(null)} />
      </header>

      <div className="stack">
        {selected && (
          // key resets the chart's loading state when the symbol changes
          <SelectedCompanyChart
            key={selected}
            service={service}
            lookupService={lookupService}
            symbol={selected}
            window={window}
          />
        )}

        {window === 'day' ? (
          <DayView service={service} />
        ) : (
          // key resets view state when switching between week and quarter
          <TrendView key={window} service={service} window={window} />
        )}
      </div>
    </main>
  );
}
