import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createNgDocAngularPlugins } from '@ng-doc/builder/generator/vite/angular/index.js';
import {
  createNgDocApplicationPlugin,
  createNgDocVitePlugin,
} from '@ng-doc/builder/generator/vite/index.js';

const workspaceRoot = fileURLToPath(new URL('../../', import.meta.url));
/** A workspace-relative path as an absolute one. */
const workspace = (file: string) => path.join(workspaceRoot, file);

/** The settings that differ between the build configurations, by Vite mode. */
const modes: Record<string, { sourcemap?: boolean }> = {
  production: {},
  development: { sourcemap: true },
};
/** The settings of any other mode: the build target options without a configuration. */
const fallback: { sourcemap?: boolean } = {};

export default ({ mode }: { mode: string }) => {
  const settings = modes[mode] ?? fallback;
  return {
    root: workspace('apps/docs/src'),
    publicDir: false,
    define: {
      NGXFB_VERSION: JSON.stringify(process.env['NGXFB_VERSION'] ?? 'v0.0.0'),
    },
    plugins: [
      createNgDocApplicationPlugin({
        workspaceRoot,
        sourceRoot: 'apps/docs/src',
        browser: 'apps/docs/src/main.ts',
        styles: [
          'node_modules/@ng-doc/app/styles/global.css',
          'node_modules/@ng-doc/app/styles/themes/dark.css',
          'libs/examples/reactive-forms/src/lib/styles/demo.scss',
          'apps/docs/src/styles.scss',
        ],
        assets: [
          {
            glob: '**/*',
            input: 'node_modules/@ng-doc/app/assets',
            output: 'assets/ng-doc/app',
          },
          {
            glob: '**/*',
            input: 'node_modules/@ng-doc/ui-kit/assets',
            output: 'assets/ng-doc/ui-kit',
          },
          { glob: '**/*', input: 'apps/docs/public' },
        ],
      }),
      createNgDocVitePlugin({
        analogLiveReload: true,
        angularPlugins: createNgDocAngularPlugins({
          tsconfig: workspace('apps/docs/tsconfig.app.json'),
          workspaceRoot,
          jit: false,
          disableTypeChecking: false,
          liveReload: true,
          inlineStylesExtension: 'scss',
        }),
        angularComponentProbe: workspace('apps/docs/src/app/app.ts'),
        generator: {
          projectId: '@ngx-formbar/docs',
          workspaceRoot,
          configFile: workspace('ng-doc.config.ts'),
          defaults: {
            docsRoot: workspace('apps/docs/src'),
            tsConfig: workspace('apps/docs/tsconfig.app.json'),
            outputRoot: workspace('ng-doc/@ngx-formbar/docs'),
            cacheRoot: workspace('.cache/ng-doc/@ngx-formbar/docs'),
          },
        },
      }),
    ],
    build: {
      outDir: workspace('dist/apps/docs/browser'),
      emptyOutDir: true,
      sourcemap: settings.sourcemap,
    },
  };
};
