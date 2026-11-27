import type { ReactNode } from 'react';
import { StatusView } from '../feedback/StatusView';
import type { PanelStatus } from '../feedback/StatusView';
import type { DataError } from '../../domain/types';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  status: PanelStatus;
  error?: DataError;
  emptyMessage?: string;
  children: ReactNode;
}

/** Titled frame that owns loading / error / empty rendering for any chart placed inside. */
export function ChartCard({ title, subtitle, status, error, emptyMessage, children }: ChartCardProps) {
  return (
    <section className="card" aria-label={title}>
      <header className="card-header">
        <h2>{title}</h2>
        {subtitle && <p className="muted">{subtitle}</p>}
      </header>
      <StatusView status={status} error={error} emptyMessage={emptyMessage}>
        {children}
      </StatusView>
    </section>
  );
}
