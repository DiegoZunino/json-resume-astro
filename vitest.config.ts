/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/components/**/*.test.ts', 'tests/contract/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/core/**', 'src/config/**'],
      reporter: ['text', 'lcov'],
      // The pure core is the contract of the project: it stays fully tested.
      thresholds: { 'src/core/**': { lines: 90, branches: 80 } },
    },
  },
});
