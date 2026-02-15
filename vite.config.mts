/// <reference types="vitest" />

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
          test: {
            name: 'node',
            include: ['**/schematics/**/*.spec.ts'],
            setupFiles: ['node-test-setup.ts'],
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
