import { WINDOWS } from '../../domain/windows';
import type { WindowId } from '../../domain/types';

interface WindowTabsProps {
  value: WindowId;
  onChange: (id: WindowId) => void;
}

export function WindowTabs({ value, onChange }: WindowTabsProps) {
  return (
    <div role="tablist" aria-label="Time window" className="tabs">
      {WINDOWS.map((w) => (
        <button
          key={w.id}
          role="tab"
          type="button"
          aria-selected={w.id === value}
          title={w.description}
          onClick={() => onChange(w.id)}
        >
          {w.label}
        </button>
      ))}
    </div>
  );
}
