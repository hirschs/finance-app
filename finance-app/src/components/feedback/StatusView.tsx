import type { ReactNode } from 'react';
import type { DataError } from '../../domain/types';

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <p role="status" className="muted">
      {label}
    </p>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <p className="muted">{message}</p>;
}

export function ErrorPanel({ error }: { error: DataError }) {
  return (
    <p role="alert" className="error">
      {error.message}
    </p>
  );
}

export type PanelStatus = 'loading' | 'error' | 'empty' | 'ready';

export function StatusView({
  status,
  error,
  emptyMessage = 'No data for this window.',
  children,
}: {
  status: PanelStatus;
  error?: DataError;
  emptyMessage?: string;
  children: ReactNode;
}) {
  if (status === 'loading') return <Loading />;
  if (status === 'error' && error) return <ErrorPanel error={error} />;
  if (status === 'empty') return <EmptyState message={emptyMessage} />;
  return <>{children}</>;
}
