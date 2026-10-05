/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/components/**/*.test.ts', 'tests/contract/**/*.test.ts'],
    coverage: { include: ['src/core/**', 'src/config/**'], reporter: ['text', 'lcov'] },
  },
});
