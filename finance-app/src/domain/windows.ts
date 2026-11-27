import type { WindowId } from './types';

export interface WindowConfig {
  id: WindowId;
  label: string;
  description: string;
}

export const WINDOWS: readonly WindowConfig[] = [
  { id: 'day', label: 'Today', description: 'Current trading day' },
  { id: 'week', label: '7 Days', description: 'Last 7 days' },
  { id: 'quarter', label: 'Quarter', description: 'Trailing 3 months' },
];

export const DEFAULT_WINDOW: WindowId = 'day';

export function getWindow(id: WindowId): WindowConfig {
  return WINDOWS.find((w) => w.id === id) ?? WINDOWS[0];
}
