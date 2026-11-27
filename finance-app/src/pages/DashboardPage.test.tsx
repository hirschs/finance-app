import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataError } from '../domain/types';
import type { MarketDataService } from '../services';
import { MockMarketDataService } from '../services/MockMarketDataService';
import { DashboardPage } from './DashboardPage';

const mock = () => new MockMarketDataService(Date.now, 0);

describe('DashboardPage', () => {
  it('opens on the current-day view with summary cards, a quote per company and both charts', async () => {
    render(<DashboardPage service={mock()} />);

    expect(await screen.findByLabelText('IBM quote')).toBeInTheDocument();
    for (const name of ['Microsoft', 'Oracle', 'SAP', 'Salesforce']) {
      expect(screen.getByLabelText(`${name} quote`)).toBeInTheDocument();
    }
    expect(screen.getByRole('tab', { name: 'Today' })).toHaveAttribute('aria-selected', 'true');

    const summary = screen.getByRole('region', { name: 'Summary' });
    expect(within(summary).getByLabelText('Best performer')).toBeInTheDocument();
    expect(within(summary).getByLabelText('IBM vs peers')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Today, session so far' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: "Today's movers" })).toBeInTheDocument();
  });

  it('shows the 7-day comparison with a ranking of all five companies', async () => {
    const base = mock();
    const getSeries = vi.fn(base.getSeries.bind(base));
    const service: MarketDataService = { getQuotes: base.getQuotes.bind(base), getSeries };

    render(<DashboardPage service={service} />);
    await userEvent.click(screen.getByRole('tab', { name: '7 Days' }));

    expect(screen.getByRole('tab', { name: '7 Days' })).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByRole('region', { name: '7-day trend comparison' })).toBeInTheDocument();
    expect(getSeries).toHaveBeenCalledWith('IBM', 'week');

    const table = await screen.findByRole('table', { name: 'Performance over the last 7 days' });
    expect(within(table).getAllByRole('row')).toHaveLength(6); // header + 5 companies
  });

  it('shows the quarter view and marks IBM in the ranking', async () => {
    render(<DashboardPage service={mock()} />);
    await userEvent.click(screen.getByRole('tab', { name: 'Quarter' }));

    expect(await screen.findByRole('region', { name: 'Quarter comparison' })).toBeInTheDocument();
    const table = await screen.findByRole('table', { name: 'Performance over the last quarter' });
    const ibmRow = within(table).getByRole('row', { name: /IBM/ });
    expect(ibmRow).toHaveClass('focus');
  });

  it('keeps the other companies visible when one history fails', async () => {
    const base = mock();
    const service: MarketDataService = {
      getQuotes: base.getQuotes.bind(base),
      getSeries: (symbol, window) =>
        symbol === 'ORCL' ? Promise.reject(new DataError('UPSTREAM', 'down')) : base.getSeries(symbol, window),
    };

    render(<DashboardPage service={service} />);
    await userEvent.click(screen.getByRole('tab', { name: 'Quarter' }));

    expect(await screen.findByText('No data for: ORCL')).toBeInTheDocument();
    const table = await screen.findByRole('table', { name: 'Performance over the last quarter' });
    expect(within(table).getAllByRole('row')).toHaveLength(5); // header + 4 companies
  });

  it('shows an error state when the data source fails', async () => {
    const service: MarketDataService = {
      getQuotes: () => Promise.reject(new DataError('UPSTREAM', 'Source unavailable')),
      getSeries: () => Promise.reject(new DataError('UPSTREAM', 'Source unavailable')),
    };
    render(<DashboardPage service={service} />);
    const alerts = await screen.findAllByRole('alert');
    expect(alerts[0]).toHaveTextContent('Source unavailable');
  });
});
