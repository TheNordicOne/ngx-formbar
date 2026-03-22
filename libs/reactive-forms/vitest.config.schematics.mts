import { defineConfig } from 'vitest/config';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/libs/reactive-forms-schematics',
  plugins: [nxViteTsPaths()],
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
