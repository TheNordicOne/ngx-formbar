/// <reference types="vitest" />

import angular from '@analogjs/vite-plugin-angular';
import viteTsConfigPaths from 'vite-tsconfig-paths';
import type { ConfigEnv } from 'vite';
import { defineConfig } from 'vite';
import { defineProject } from 'vitest/config';

// https://vitejs.dev/config/
export default defineConfig(({ mode }: ConfigEnv) => {
  return {
    test: {
      reporters: ['default'],
      passWithNoTests: true,
      projects: [
        defineProject({
          plugins: [angular(), viteTsConfigPaths()],
          test: {
            name: 'component',
            environment: 'jsdom',
            setupFiles: ['src/test-setup.ts'],
            globals: true,
            include: ['**/*.spec.ts'],
            exclude: ['**/builders/**'],
          },
        }),
        defineProject({
          test: {
            name: 'node',
            include: ['**/builders/**/*.spec.ts'],
            environment: 'node',
            globals: true,
          },
        }),
      ],
    },

    define: {
      'import.meta.vitest': mode !== 'production',
    },
  };
});
