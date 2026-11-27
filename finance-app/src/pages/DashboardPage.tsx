import { useState } from 'react';
import { WindowTabs } from '../components/controls/WindowTabs';
import { DEFAULT_WINDOW } from '../domain/windows';
import type { WindowId } from '../domain/types';
import { marketData } from '../services';
import type { MarketDataService } from '../services';
import { DayView } from '../views/DayView';
import { TrendView } from '../views/TrendView';

interface DashboardPageProps {
  service?: MarketDataService;
}

export function DashboardPage({ service = marketData }: DashboardPageProps) {
  const [window, setWindow] = useState<WindowId>(DEFAULT_WINDOW);

  return (
    <main className="page">
      <header className="page-header">
        <h1>Market Dashboard</h1>
        <p className="muted">IBM compared with major competitors</p>
        <WindowTabs value={window} onChange={setWindow} />
      </header>

      {window === 'day' ? (
        <DayView service={service} />
      ) : (
        // key resets view state when switching between week and quarter
        <TrendView key={window} service={service} window={window} />
      )}
    </main>
  );
}
