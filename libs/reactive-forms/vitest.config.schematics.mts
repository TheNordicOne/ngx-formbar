import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  resolve: {
    tsconfigPaths: true,
  },
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/libs/reactive-forms-schematics',
  test: {
    name: '@ngx-formbar/reactive-forms-schematics',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['schematics/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/libs/reactive-forms-schematics',
      provider: 'v8' as const,
    },
  },
}));
