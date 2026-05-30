import { defineConfig } from 'vitest/config';
import path from 'path';

// Isolated test config (kept separate from the PWA build config in vite.config.ts).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    globals: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
