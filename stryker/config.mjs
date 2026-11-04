const SCHEMATICS_TESTS =
  'cd libs/schematics && npx vitest run --bail 1 --maxWorkers 3 --reporter=dot';
const NG_ADD_TESTS =
  'cd libs/reactive-forms && npx vitest run --config vitest.config.schematics.mts --bail 1 --maxWorkers 3 --reporter=dot';
const NX = 'NX_DAEMON=false NX_DISABLE_DB=true npx nx';

const NOT_MUTATED = [
  '!**/tests/**',
  '!**/*.spec.ts',
  '!**/*.test.ts',
  '!**/*.type.ts',
  '!**/*.stories.ts',
  '!**/schema.ts',
  '!**/*.d.ts',
];

function config(name, mutate, testCommand, buildCommand) {
  return {
    testRunner: 'command',
    commandRunner: { command: testCommand },
    buildCommand,
    mutate: [mutate, ...NOT_MUTATED],
    concurrency: 5,
    // A run takes much longer under load than the dry run the limit derives from.
    timeoutMS: 120000,
    timeoutFactor: 3,
    plugins: ['./stryker/ignore-signal-options.mjs'],
    ignorers: ['signal-options'],
    reporters: ['html', 'json', 'progress-append-only'],
    htmlReporter: { fileName: `reports/mutation/${name}/index.html` },
    jsonReporter: { fileName: `reports/mutation/${name}/mutation.json` },
    // Nx cannot read the lockfile through the node_modules link in the sandbox.
    ignorePatterns: [
      'pnpm-lock.yaml',
      'dist',
      '.nx',
      '.angular',
      'reports',
      '.stryker-tmp*',
    ],
    tempDirName: `.stryker-tmp-${name}`,
    cleanTempDir: 'always',
  };
}

/** The specs run the built collections, so the instrumented code is built once. */
export function schematicsConfig(name, mutate, { schematics, ngAdd }) {
  return config(
    name,
    mutate,
    [
      ...(schematics ? [SCHEMATICS_TESTS] : []),
      ...(ngAdd ? [NG_ADD_TESTS] : []),
    ]
      .map((command) => `( ${command} )`)
      .join(' && '),
    'node stryker/build.mjs schematics',
  );
}

/**
 * Most runtime behavior is only tested through stories, in a browser that has
 * no environment variable to read the active mutant from, so the server sets it
 * from the URL.
 */
export function runtimeConfig(name, mutate, projects, port) {
  return config(
    name,
    mutate,
    [
      ...projects.map((project) => `${NX} test ${project} --skip-nx-cache`),
      `npx test-storybook -c apps/storybook/.storybook --url "http://127.0.0.1:${port}/m/id-$__STRYKER_ACTIVE_MUTANT__" --index-json --maxWorkers 3`,
    ].join(' && '),
    `node stryker/build.mjs runtime ${port}`,
  );
}
