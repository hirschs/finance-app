import { useEffect, useState } from 'react';
import { toDataError } from '../domain/types';
import type { DataError } from '../domain/types';

export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: DataError };

/** Runs `load` whenever its identity changes. Callers must keep `load` stable (useCallback). */
export function useAsync<T>(load: () => Promise<T>): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    load().then(
      (data) => {
        if (!cancelled) setState({ status: 'success', data });
      },
      (err: unknown) => {
        if (!cancelled) setState({ status: 'error', error: toDataError(err) });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [load]);

  return state;
}
