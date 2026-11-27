import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => cleanup());

// Browser-only shims; server tests run in the node environment where these don't exist.
if (typeof window !== 'undefined') {
  // Recharts' ResponsiveContainer needs ResizeObserver, which jsdom lacks.
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = globalThis.ResizeObserver ?? ResizeObserverStub;

  // jsdom does no layout, so give elements a size to avoid Recharts' zero-size warning.
  Element.prototype.getBoundingClientRect = () =>
    ({ width: 640, height: 320, top: 0, left: 0, right: 640, bottom: 320, x: 0, y: 0, toJSON() {} }) as DOMRect;
}
