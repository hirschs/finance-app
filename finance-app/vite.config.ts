import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  server: {
    // Browser calls /api/*; the Node proxy in server/ talks to Yahoo Finance.
    proxy: { '/api': 'http://localhost:3001' },
  },
  build: {
    // Recharts alone is ~500 kB minified; revisit with code-splitting if the bundle grows.
    chunkSizeWarningLimit: 700,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
