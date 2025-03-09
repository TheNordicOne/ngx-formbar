import { defineConfig } from 'cypress';

export default defineConfig({
  component: {
    devServer: {
      framework: 'angular',
      bundler: 'webpack',
      webpackConfig: { stats: 'errors-only' },
    },
    specPattern: '**/*.cy.ts',
  },
});
