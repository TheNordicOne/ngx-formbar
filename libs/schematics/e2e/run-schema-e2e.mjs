/**
 * Runs the schematics the way a consumer does: packed tarballs, installed into
 * fresh Angular apps outside this repository, driven through the real Angular
 * CLI. One app runs `schema` over a hand-written content union and over the
 * union of a library project in it, then goes through `ng add` with a renamed
 * config and scaffolds through it, and with paths in the forms the generators
 * read differently from plain concatenation, and in every layout the root
 * providers can have. A second one starts from `ng new --no-standalone`. A
 * third one goes through `ng add`, scaffolds into the seeded union, re-runs
 * `ng add`, runs `schema` and builds. The rows of "Where Components Go" and a
 * run without a schematics configuration file go through the CLI too. Every
 * other test in these libraries runs inside this workspace against a virtual
 * Tree, which is the shape of test that passes while the shipped artifact is
 * broken.
 */
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, sep } from 'node:path';
import Ajv from 'ajv';
import Ajv2020 from 'ajv/dist/2020.js';
import ts from 'typescript';

const WORKSPACE_ROOT = process.cwd();
const PACKAGES = ['core', 'setup', 'schematics', 'reactive-forms'];
const CORE_PACKAGE_NAME = '@ngx-formbar/core';
const SCHEMATICS_PACKAGE_NAME = '@ngx-formbar/schematics';
const REACTIVE_FORMS_PACKAGE_NAME = '@ngx-formbar/reactive-forms';
const DRAFT_2020_12 = 'https://json-schema.org/draft/2020-12/schema';
const DRAFT_07 = 'http://json-schema.org/draft-07/schema#';

const CONTENT_TYPE = `import {
  NgxFbArray,
  NgxFbBlock,
  NgxFbControl,
  NgxFbFormGroup,
} from '@ngx-formbar/core';

/** A single-line text input. */
export interface TextControl extends NgxFbControl {
  type: 'text';
  /** Longest value the input accepts. */
  maxLength?: number;
}

/** A section holding further content, sections included. */
export interface SectionGroup extends NgxFbFormGroup<AppContent> {
  type: 'section';
}

/** A repeatable list of rows. */
export interface RepeatArray extends NgxFbArray<AppContent> {
  type: 'repeat';
}

/** A section left on core's default children, as the Groups guide writes it. */
export interface PlainGroup extends NgxFbFormGroup {
  type: 'plain';
}

/** Static text rendered between controls. */
export interface NoteBlock extends NgxFbBlock {
  type: 'note';
  text: string;
}

/**
 * Every form node type this app supports.
 * The \`schema\` schematic reads this union; scaffolding a control adds to it.
 */
export type AppContent =
  | TextControl
  | SectionGroup
  | RepeatArray
  | NoteBlock
  | PlainGroup;
`;

/**
 * A second file the emitter imports relatively, so the run also covers a
 * multi-file emitter served out of the Tree rather than from disk.
 */
const DESCRIBE_NODE = `import type { FormNode } from '@ngx-formbar/schematics';
import { toJsonTypes } from '@ngx-formbar/schematics';

export function describeNode(node: FormNode) {
  return {
    name: node.name,
    kind: node.kind,
    typeLiteral: node.typeLiteral,
    open: node.open,
    children: node.children ? node.children.members : null,
    properties: node.properties.map((property) => ({
      name: property.name,
      optional: property.optional,
      doc: property.doc ?? null,
      json: toJsonTypes(property.type),
    })),
  };
}
`;

const INVENTORY_EMITTER = `import { control, defineEmitter } from '@ngx-formbar/schematics';
import { describeNode } from './describe-node';

/**
 * The loader serves this package's emitter-facing surface from the running
 * schematic instead of letting Node resolve a second live copy out of
 * node_modules. \`control\` is a real export of the installed package and is
 * deliberately withheld, so reaching it has to fail.
 */
function probeWithheldExport() {
  try {
    return { outcome: 'served', type: typeof control };
  } catch (error) {
    return { outcome: 'threw', message: String(error) };
  }
}

export default defineEmitter({
  name: 'e2e-inventory',
  emit(model, ctx) {
    const document = {
      root: model.root,
      nodes: Object.values(model.nodes).map(describeNode),
      withheldExport: probeWithheldExport(),
      options: ctx.options,
      paths: ctx.paths,
    };

    ctx.tree.create(ctx.paths.output, JSON.stringify(document, null, 2) + '\\n');
  },
});
`;

const SHARED_TEXT_CONTROL = `import { NgxFbControl } from '@ngx-formbar/core';

export interface SharedTextControl extends NgxFbControl {
  type: 'sharedText';
}
`;

/** Reaches its member only through a `paths` alias of the root tsconfig. */
const LIBRARY_CONTENT_TYPE = `import { SharedTextControl } from '@consumer/shared/text-control';

export type LibraryContent = SharedTextControl;
`;

const LIBRARY_SCHEMATIC_CONFIG = {
  schema: {
    type: 'content.type.ts#LibraryContent',
    emitters: [{ use: 'json-schema-2020-12', output: 'form.schema.json' }],
  },
};

const LIBRARY_FORM = {
  content: { name: { type: 'sharedText', label: 'Name' } },
};

const SCHEMATIC_CONFIG = {
  schema: {
    type: 'app/types/content.type.ts#AppContent',
    emitters: [
      { use: 'json-schema-2020-12', output: 'form.schema.json' },
      { use: 'json-schema-draft-07', output: 'form.draft-07.schema.json' },
      { use: './tools/inventory-emitter.ts', output: 'inventory.json' },
    ],
  },
};

const VALID_FORM = {
  content: {
    name: { type: 'text', label: 'Name', maxLength: 40 },
    details: {
      type: 'section',
      controls: {
        intro: { type: 'note', isControl: false, text: 'Tell us about you.' },
        // A control nested in a group keeps the full `hideStrategy`, so the row
        // narrowing must not have leaked into the union both of them reference.
        nickname: { type: 'text', label: 'Nickname', hideStrategy: 'remove' },
      },
    },
    aliases: {
      type: 'repeat',
      rowControl: { type: 'text', label: 'Alias', hideStrategy: 'keep' },
    },
    plain: {
      type: 'plain',
      controls: {
        city: { type: 'text', label: 'City' },
        stops: { type: 'repeat', rowControl: { type: 'text' } },
      },
    },
  },
};

const INVALID_FORM = {
  content: {
    name: { type: 'text', label: 'Name', notAProperty: true },
  },
};

/** `NgxFbArray` types its row as `T & { hideStrategy?: 'keep' }`. */
const NARROWED_ROW_FORM = {
  content: {
    aliases: {
      type: 'repeat',
      rowControl: { type: 'text', hideStrategy: 'remove' },
    },
  },
};

/** `NgxFbItem` children stand for the registered members, not any `type`. */
const UNREGISTERED_CHILD_FORM = {
  content: {
    plain: { type: 'plain', controls: { city: { type: 'txet' } } },
  },
};

/** Uses the camelCase key and the group the scaffolds added to the union. */
const SCAFFOLDED_FORM = {
  content: {
    phone: { type: 'phoneNumber', label: 'Phone' },
    address: {
      type: 'address',
      controls: { mobile: { type: 'phoneNumber' } },
    },
  },
};

const UNKNOWN_TYPE_FORM = {
  content: {
    phone: { type: 'faxNumber' },
  },
};

const failures = [];

function check(condition, description) {
  if (condition) {
    console.log(`  ok    ${description}`);
    return;
  }

  failures.push(description);
  console.log(`  FAIL  ${description}`);
}

function run(command, args, cwd, env = {}) {
  const started = Date.now();
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, CI: 'true', NG_CLI_ANALYTICS: 'false', ...env },
  });

  console.log(
    `$ ${command} ${args.join(' ')}  (${Math.round((Date.now() - started) / 1000)}s)`,
  );

  const stdout = result.stdout ?? '';
  const combined = `${stdout}${result.stderr ?? ''}`;

  if (result.status !== 0) {
    console.log(combined);
    throw new Error(
      `${command} ${args.join(' ')} exited with ${result.status}`,
    );
  }

  return { stdout, combined };
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

/**
 * `workspace:` ranges are rewritten at release time against the registry. Here
 * the sibling tarball takes that role for dependencies, and peer dependencies
 * get the caret range the release writes, so the manifest a consumer installs
 * is the built one and not a hand-assembled node_modules. The release gives all
 * packages one version, which `ng add` relies on for the range it saves.
 */
function stagePackage(name, stagingDir, tarballs, versions) {
  const staged = join(stagingDir, name);
  cpSync(join(WORKSPACE_ROOT, 'dist', 'libs', name), staged, {
    recursive: true,
  });

  const manifestPath = join(staged, 'package.json');
  const manifest = readJson(manifestPath);

  manifest.version = readJson(
    join(WORKSPACE_ROOT, 'dist', 'libs', 'reactive-forms', 'package.json'),
  ).version;

  for (const [dependency, range] of Object.entries(
    manifest.dependencies ?? {},
  )) {
    if (typeof range === 'string' && range.startsWith('workspace:')) {
      manifest.dependencies[dependency] = `file:${tarballs.get(dependency)}`;
    }
  }

  for (const [dependency, range] of Object.entries(
    manifest.peerDependencies ?? {},
  )) {
    if (typeof range === 'string' && range.startsWith('workspace:')) {
      manifest.peerDependencies[dependency] = `^${versions.get(dependency)}`;
    }
  }

  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  return { staged, manifest };
}

function packPackage(stagedDir, stagingDir) {
  // The file listing goes to stderr, so only stdout is the JSON document.
  const { stdout } = run(
    'npm',
    ['pack', '--json', '--pack-destination', stagingDir],
    stagedDir,
  );
  const [entry] = JSON.parse(stdout);

  return {
    tarball: join(stagingDir, entry.filename),
    files: entry.files.map((file) => file.path),
  };
}

function writeConsumerFixture(appDir) {
  mkdirSync(join(appDir, 'src', 'app', 'types'), { recursive: true });
  mkdirSync(join(appDir, 'src', 'tools'), { recursive: true });

  writeFileSync(
    join(appDir, 'src', 'app', 'types', 'content.type.ts'),
    CONTENT_TYPE,
  );
  writeFileSync(
    join(appDir, 'src', 'app', 'formbar-schematic.config.json'),
    `${JSON.stringify(SCHEMATIC_CONFIG, null, 2)}\n`,
  );
  writeFileSync(
    join(appDir, 'src', 'tools', 'describe-node.ts'),
    DESCRIBE_NODE,
  );
  writeFileSync(
    join(appDir, 'src', 'tools', 'inventory-emitter.ts'),
    INVENTORY_EMITTER,
  );
}

function readLoggedCoreRoot(output) {
  const match = /Resolved @ngx-formbar\/core at "([^"]+)"/.exec(output);
  return match ? match[1] : null;
}

/**
 * The schematic's CompilerHost reads the Tree first and falls back to disk, and
 * `getCurrentDirectory()` is '/', so a Tree path and a real path travel the
 * same fallback. Anchoring the logged value against the app is the only way to
 * tell the consumer's own install from something else the machine happens to
 * have at that path.
 */
function checkCoreRoot(coreRoot, appDir) {
  const expected = join(appDir, 'node_modules', CORE_PACKAGE_NAME) + sep;
  const resolved = existsSync(coreRoot) ? coreRoot : join(appDir, coreRoot);

  console.log(`  core root: ${coreRoot} -> ${resolved}`);

  check(
    resolved === expected && existsSync(resolved),
    `core resolved inside the consumer app, at ${expected}`,
  );
}

function validateWith(ajv, document, dialect) {
  const validate = ajv.compile(document);

  check(
    validate(VALID_FORM) === true,
    `${dialect} accepts a config covering all four node kinds`,
  );
  check(
    validate(INVALID_FORM) === false,
    `${dialect} rejects a control carrying an unknown property`,
  );
  check(
    validate(NARROWED_ROW_FORM) === false,
    `${dialect} rejects a row top using hideStrategy 'remove'`,
  );
  check(
    validate(UNREGISTERED_CHILD_FORM) === false,
    `${dialect} rejects an unregistered type under a group left on core's default children`,
  );
}

function checkInventory(inventory, appDir) {
  const kinds = inventory.nodes.map((node) => node.kind).sort();
  const names = inventory.nodes.map((node) => node.name).sort();
  const array = inventory.nodes.find((node) => node.kind === 'array');
  const group = inventory.nodes.find((node) => node.name === 'SectionGroup');
  const plain = inventory.nodes.find((node) => node.name === 'PlainGroup');

  check(
    JSON.stringify(kinds) ===
      JSON.stringify(['array', 'block', 'control', 'group', 'group']),
    'the local emitter saw all four node kinds',
  );
  check(
    JSON.stringify(names) ===
      JSON.stringify([
        'NoteBlock',
        'PlainGroup',
        'RepeatArray',
        'SectionGroup',
        'TextControl',
      ]),
    'the local emitter saw exactly the declared nodes, with no intersection left over',
  );
  check(
    group?.children?.includes('SectionGroup') === true,
    'the self-referential group points back at the union',
  );
  check(
    JSON.stringify([...(plain?.children ?? [])].sort()) ===
      JSON.stringify(names),
    "the group left on core's default children takes every registered member",
  );
  check(
    array?.children?.includes('RepeatArray') === true,
    "the array row points back at the union through core's hideStrategy narrowing",
  );
  check(
    inventory.withheldExport.outcome === 'threw' &&
      inventory.withheldExport.message.includes(SCHEMATICS_PACKAGE_NAME),
    'the emitter was served this package from the running schematic, not a second copy',
  );
  check(
    inventory.paths.workspaceRoot === appDir,
    'the emitter received the consumer app as the on-disk workspace root',
  );
}

/** The Angular CLI keeps the cwd of a run started below the workspace root. */
function checkSubdirectoryRun(appDir) {
  run(
    'npx',
    [
      'ng',
      'generate',
      `${SCHEMATICS_PACKAGE_NAME}:schema`,
      '--project',
      'consumer',
      '--emitter',
      './tools/inventory-emitter.ts',
      '--output',
      'inventory-subdirectory.json',
    ],
    join(appDir, 'src', 'app'),
  );

  const inventoryPath = join(appDir, 'src', 'inventory-subdirectory.json');

  check(
    existsSync(inventoryPath) &&
      readJson(inventoryPath).paths.workspaceRoot === appDir,
    'a run from a subdirectory hands the emitter the consumer app as the workspace root',
  );
}

/**
 * A library has no `tsconfig.app.json`, so the alias in the root tsconfig
 * reaches its union only through the library's own tsconfig.
 */
function runLibraryFlow(appDir) {
  const libraryName = 'forms-lib';
  const sourceRoot = join(appDir, 'projects', libraryName, 'src');
  const tsConfigPath = join(appDir, 'tsconfig.json');

  run(
    'npx',
    ['ng', 'generate', 'library', libraryName, '--skip-install'],
    appDir,
  );

  const { config } = ts.parseConfigFileTextToJson(
    tsConfigPath,
    readFileSync(tsConfigPath, 'utf8'),
  );
  config.compilerOptions.paths = {
    ...config.compilerOptions.paths,
    '@consumer/shared/*': ['./shared/*'],
  };
  writeFileSync(tsConfigPath, `${JSON.stringify(config, null, 2)}\n`);

  mkdirSync(join(appDir, 'shared'), { recursive: true });
  writeFileSync(join(appDir, 'shared', 'text-control.ts'), SHARED_TEXT_CONTROL);
  writeFileSync(join(sourceRoot, 'content.type.ts'), LIBRARY_CONTENT_TYPE);
  writeFileSync(
    join(sourceRoot, 'formbar-schematic.config.json'),
    `${JSON.stringify(LIBRARY_SCHEMATIC_CONFIG, null, 2)}\n`,
  );

  generate(appDir, libraryName, 'schema', [
    '--schematics-config=formbar-schematic.config.json',
  ]);

  console.log('library assertions:');

  const schemaPath = join(sourceRoot, 'form.schema.json');
  check(
    existsSync(schemaPath),
    "schema wrote the library's schema through the root path alias",
  );

  if (existsSync(schemaPath)) {
    const validate = new Ajv2020({ strict: false }).compile(
      readJson(schemaPath),
    );

    check(
      validate(LIBRARY_FORM) === true,
      "the library's schema accepts a config using the aliased member",
    );
    check(
      validate(UNKNOWN_TYPE_FORM) === false,
      "the library's schema rejects a type outside its union",
    );
  }
}

function checkPackedFiles(files) {
  const leaked = files.filter(
    (file) => /(^|\/)tests\//.test(file) || /\.(spec|test)\./.test(file),
  );

  // Without this the leak check passes on an empty or mis-parsed listing.
  check(
    files.includes('lib/collection.json') && files.includes('src/index.d.ts'),
    `the packed listing covers the package (${files.length} files)`,
  );
  check(
    leaked.length === 0,
    `the packed tarball ships no test files${leaked.length ? `, found ${leaked.join(', ')}` : ''}`,
  );
}

function createApp(name, appParent, newOptions = []) {
  const appDir = join(appParent, name);

  run(
    'npx',
    [
      '--yes',
      '@angular/cli@21',
      'new',
      name,
      '--skip-git',
      '--skip-install',
      '--defaults',
      '--package-manager',
      'npm',
      ...newOptions,
    ],
    appParent,
  );
  run('npm', ['install'], appDir);

  return appDir;
}

function findFile(directory, fileName) {
  const match = readdirSync(directory, { recursive: true }).find(
    (entry) => basename(entry) === fileName,
  );

  return match ? join(directory, match) : null;
}

/**
 * The tarball is installed beforehand, so `ng add` uses it as is. ng-add then
 * queues an install of what it adds to package.json, which could replace the
 * tarballs with whatever the registry has. That install runs as an npm dry run,
 * so the app keeps the packages under test.
 */
function ngAdd(appDir, project, args = []) {
  return run(
    'npx',
    [
      'ng',
      'add',
      REACTIVE_FORMS_PACKAGE_NAME,
      '--project',
      project,
      '--defaults',
      '--skip-confirmation',
      ...args,
    ],
    appDir,
    { npm_config_dry_run: 'true' },
  );
}

function generate(cwd, project, schematic, args = []) {
  return run(
    'npx',
    [
      'ng',
      'generate',
      `${SCHEMATICS_PACKAGE_NAME}:${schematic}`,
      '--project',
      project,
      ...args,
    ],
    cwd,
  );
}

/**
 * The lookup does not find a config under another name, so ng add has to point
 * the generators at the one it wrote. The consumer app's own config sits where
 * the lookup looks first, so a generator that missed the link would read that
 * one and register by token.
 */
function runLinkedConfigFlow(appDir, tarballs) {
  run('npm', ['install', tarballs.get(REACTIVE_FORMS_PACKAGE_NAME)], appDir);
  ngAdd(appDir, 'consumer', [
    '--schematic-config-file-name=custom.json',
    '--registration-style=config',
  ]);
  generate(appDir, 'consumer', 'control', ['--key', 'slider']);

  console.log('linked config assertions:');

  const schematics = readJson(join(appDir, 'angular.json')).projects.consumer
    .schematics;
  const registrationsPath = join(
    appDir,
    'src',
    'app',
    'registrations',
    'component-registrations.ts',
  );

  check(
    schematics?.[`${SCHEMATICS_PACKAGE_NAME}:control`]?.schematicsConfig ===
      'app/custom.json',
    'ng add pointed the generators at the config it wrote under another name',
  );
  check(
    existsSync(registrationsPath) &&
      /["']?slider["']?:\s*loadComponent\(/.test(
        readFileSync(registrationsPath, 'utf8'),
      ),
    'the scaffolded control registered as the linked config says',
  );
}

/**
 * `ng add` and the generators have to agree on what a path option means, so
 * this runs in a project whose source root is not the workspace root, using
 * the forms where plain concatenation would land elsewhere.
 */
function runPathOptionsFlow(appDir) {
  const project = 'paths-app';
  const sourceRoot = join(appDir, 'projects', project, 'src');

  run(
    'npx',
    ['ng', 'generate', 'application', project, '--skip-install', '--defaults'],
    appDir,
  );

  ngAdd(appDir, project, [
    '--schematics-config-path=/paths-config',
    `--helper-path=projects/${project}/src/app/paths-helper`,
    '--registrations-path=/paths-registrations',
  ]);
  generate(appDir, project, 'control', ['--key', 'slider']);
  run('npx', ['ng', 'build', project], appDir);

  console.log('path options assertions:');

  const schematics = readJson(join(appDir, 'angular.json')).projects[project]
    .schematics;
  const component = readFileSync(
    join(sourceRoot, 'app', 'slider', 'slider-control.ts'),
    'utf8',
  );
  const registrationsPath = join(
    appDir,
    'paths-registrations',
    'component-registrations.ts',
  );

  check(
    existsSync(join(appDir, 'paths-config', 'formbar-schematic.config.json')),
    'a "/" schematicsConfigPath wrote the config under the workspace root',
  );
  check(
    schematics?.[`${SCHEMATICS_PACKAGE_NAME}:control`]?.schematicsConfig ===
      '/paths-config/formbar-schematic.config.json',
    'ng add pointed the generators at the "/" config',
  );
  check(
    existsSync(join(sourceRoot, 'app', 'paths-helper', 'view-provider.ts')),
    'a helperPath with the source root did not nest the source root again',
  );
  check(
    /import \{ viewProviders \} from '\.\.\/paths-helper';/.test(component),
    'the scaffold uses the helper',
  );
  check(
    existsSync(registrationsPath) &&
      readFileSync(registrationsPath, 'utf8').includes('SliderControl'),
    'the scaffold registered into the "/" registrations file',
  );
  check(
    readFileSync(
      join(sourceRoot, 'app', 'types', 'content.type.ts'),
      'utf8',
    ).includes('SliderControlConfig'),
    'the scaffold read schema.type from the "/" config',
  );
}

/**
 * `main.ts` moves to a config elsewhere. The generated `app.config.ts` stays
 * behind unused, so a run that assumed the default location would edit it.
 */
function runMovedConfigFlow(appDir) {
  const project = 'moved-config-app';
  const sourceRoot = join(appDir, 'projects', project, 'src');
  const defaultConfigPath = join(sourceRoot, 'app', 'app.config.ts');
  const movedConfigPath = join(sourceRoot, 'bootstrap', 'config.ts');
  const mainPath = join(sourceRoot, 'main.ts');

  run(
    'npx',
    ['ng', 'generate', 'application', project, '--skip-install', '--defaults'],
    appDir,
  );

  const defaultConfig = readFileSync(defaultConfigPath, 'utf8');

  mkdirSync(dirname(movedConfigPath), { recursive: true });
  writeFileSync(
    movedConfigPath,
    defaultConfig.replace('./app.routes', '../app/app.routes'),
  );
  writeFileSync(
    mainPath,
    readFileSync(mainPath, 'utf8').replace(
      './app/app.config',
      './bootstrap/config',
    ),
  );

  ngAdd(appDir, project, ['--split-registrations=false']);
  generate(appDir, project, 'control', ['--key', 'slider']);
  run('npx', ['ng', 'build', project], appDir);

  console.log('moved config assertions:');

  const movedConfig = readFileSync(movedConfigPath, 'utf8');

  check(
    movedConfig.includes('provideFormbar('),
    'ng add provided formbar in the config main.ts imports',
  );
  check(
    movedConfig.includes('SliderControl'),
    'the scaffold registered into the config main.ts imports',
  );
  check(
    readFileSync(defaultConfigPath, 'utf8') === defaultConfig,
    'ng add left the unused config at the default location alone',
  );
}

const KEPT_INDEX = 'export const other = 1;\n';

/**
 * `ng add` keeps an existing `index.ts`, which need not export what it seeds,
 * and registrations and helper files seeded into one folder share one index.
 * The build proves the imports go where the exports are.
 */
function runKeptIndexFlow(appDir) {
  const sharedFolder = [
    '--registrations-path=app/shared',
    '--helper-path=app/shared',
  ];
  const runs = [
    { name: 'kept-index-token', args: sharedFolder, keptIndex: 'shared' },
    {
      name: 'kept-index-config',
      args: [...sharedFolder, '--registration-style=config'],
      keptIndex: 'shared',
    },
    {
      name: 'one-folder-token',
      args: ['--registrations-path=app/x', '--helper-path=app/x'],
    },
    {
      name: 'one-folder-config',
      args: [
        '--registrations-path=app/x',
        '--helper-path=app/x',
        '--registration-style=config',
      ],
    },
  ];

  for (const { name, args, keptIndex } of runs) {
    const app = join(appDir, 'projects', name, 'src', 'app');
    const index = join(app, keptIndex ?? '', 'index.ts');

    run(
      'npx',
      ['ng', 'generate', 'application', name, '--skip-install', '--defaults'],
      appDir,
    );

    if (keptIndex) {
      mkdirSync(dirname(index), { recursive: true });
      writeFileSync(index, KEPT_INDEX);
    }

    ngAdd(appDir, name, args);
    generate(appDir, name, 'control', ['--key', 'slider']);
    run('npx', ['ng', 'build', name], appDir);

    console.log(`${name} assertions:`);

    check(
      !keptIndex || readFileSync(index, 'utf8') === KEPT_INDEX,
      `${name}: ng add kept the index and the build passed`,
    );
    check(
      /from '\.\.\/[a-z]+\/view-provider'/.test(
        readFileSync(join(app, 'slider', 'slider-control.ts'), 'utf8'),
      ),
      `${name}: the scaffold imports the helper from its file`,
    );
  }
}

function replaceInFile(path, search, replacement) {
  writeFileSync(path, readFileSync(path, 'utf8').replace(search, replacement));
}

const APP_CONFIG_CALL = 'bootstrapApplication(App, appConfig)';

const SHARED_APP_CONFIG = `import { ApplicationConfig } from '@angular/core';

export const appConfig: ApplicationConfig = { providers: [] };
`;

/**
 * Each layout starts from a generated application. `arrange` changes where the
 * root providers live, and `holder` names the file that has to end up holding
 * them, relative to the source root. The build proves the edited file compiles.
 */
const ROOT_CONFIG_LAYOUTS = [
  {
    name: 'inline-object',
    holder: 'main.ts',
    arrange: ({ main }) =>
      replaceInFile(
        main,
        APP_CONFIG_CALL,
        'bootstrapApplication(App, { providers: [] })',
      ),
  },
  {
    name: 'no-config',
    holder: 'main.ts',
    arrange: ({ main }) =>
      replaceInFile(main, APP_CONFIG_CALL, 'bootstrapApplication(App)'),
  },
  {
    name: 'function-call',
    holder: 'main.ts',
    arrange: ({ main }) => {
      replaceInFile(
        main,
        APP_CONFIG_CALL,
        'bootstrapApplication(App, makeConfig())',
      );
      writeFileSync(
        main,
        `${readFileSync(main, 'utf8')}\nfunction makeConfig() {\n  return appConfig;\n}\n`,
      );
    },
  },
  {
    name: 'imported-function-call',
    holder: 'main.ts',
    arrange: ({ main, sourceRoot }) => {
      writeFileSync(
        join(sourceRoot, 'make-config.ts'),
        `import { appConfig } from './app/app.config';\n\nexport const makeConfig = () => appConfig;\n`,
      );
      replaceInFile(
        main,
        /import \{ appConfig \} from '\.\/app\/app\.config';/,
        `import { makeConfig } from './make-config';`,
      );
      replaceInFile(
        main,
        APP_CONFIG_CALL,
        'bootstrapApplication(App, makeConfig())',
      );
    },
  },
  {
    name: 'barrel',
    holder: 'config/app.config.ts',
    arrange: ({ main, sourceRoot }) => {
      const configDir = join(sourceRoot, 'config');
      const config = readFileSync(
        join(sourceRoot, 'app', 'app.config.ts'),
        'utf8',
      );

      mkdirSync(configDir, { recursive: true });
      writeFileSync(
        join(configDir, 'app.config.ts'),
        config.replace('./app.routes', '../app/app.routes'),
      );
      writeFileSync(
        join(configDir, 'index.ts'),
        `export * from './app.config';\n`,
      );
      replaceInFile(main, './app/app.config', './config');
    },
  },
  {
    name: 'path-alias',
    holder: 'app/app.config.ts',
    arrange: ({ main, project, appDir }) => {
      const tsConfigPath = join(appDir, 'tsconfig.json');
      const { config } = ts.parseConfigFileTextToJson(
        tsConfigPath,
        readFileSync(tsConfigPath, 'utf8'),
      );

      config.compilerOptions.paths = {
        ...config.compilerOptions.paths,
        [`@${project}/config`]: [`./projects/${project}/src/app/app.config.ts`],
      };
      writeFileSync(tsConfigPath, `${JSON.stringify(config, null, 2)}\n`);
      replaceInFile(main, './app/app.config', `@${project}/config`);
    },
  },
  {
    name: 'dynamic-import',
    holder: 'app/app.config.ts',
    arrange: ({ main, sourceRoot }) => {
      writeFileSync(
        join(sourceRoot, 'bootstrap.ts'),
        readFileSync(main, 'utf8'),
      );
      writeFileSync(main, `import('./bootstrap').catch(console.error);\n`);
    },
  },
  {
    name: 'namespace-call',
    holder: 'app/app.config.ts',
    arrange: ({ main }) => {
      replaceInFile(
        main,
        `import { bootstrapApplication } from '@angular/platform-browser';`,
        `import * as pb from '@angular/platform-browser';`,
      );
      replaceInFile(
        main,
        APP_CONFIG_CALL,
        'pb.bootstrapApplication(App, appConfig)',
      );
    },
  },
  {
    name: 'trailing-comma',
    holder: 'main.ts',
    arrange: ({ main }) => {
      replaceInFile(main, APP_CONFIG_CALL, 'bootstrapApplication(\n  App,\n)');
      writeFileSync(
        main,
        readFileSync(main, 'utf8').replace(
          /import \{ appConfig \} from '\.\/app\/app\.config';\n/,
          '',
        ),
      );
    },
  },
  {
    name: 'namespace-core',
    holder: 'main.ts',
    arrange: ({ main }) => {
      writeFileSync(
        main,
        `import * as ng from '@angular/core';\n${readFileSync(main, 'utf8')}\nng.isDevMode();\n\nfunction makeConfig() {\n  return appConfig;\n}\n`,
      );
      replaceInFile(
        main,
        APP_CONFIG_CALL,
        'bootstrapApplication(App, makeConfig())',
      );
    },
  },
  {
    name: 'spread-after-providers',
    holder: 'main.ts',
    arrange: ({ main }) =>
      replaceInFile(
        main,
        APP_CONFIG_CALL,
        'const base: Partial<typeof appConfig> = appConfig;\n\nbootstrapApplication(App, { providers: [], ...base })',
      ),
  },
  {
    name: 'other-project-config',
    holder: 'main.ts',
    keeps: 'shared-config/app.config.ts',
    arrange: ({ main, appDir }) => {
      const tsConfigPath = join(appDir, 'tsconfig.json');
      const { config } = ts.parseConfigFileTextToJson(
        tsConfigPath,
        readFileSync(tsConfigPath, 'utf8'),
      );

      mkdirSync(join(appDir, 'shared-config'), { recursive: true });
      writeFileSync(
        join(appDir, 'shared-config', 'app.config.ts'),
        SHARED_APP_CONFIG,
      );
      config.compilerOptions.paths = {
        ...config.compilerOptions.paths,
        '@shared/config': ['./shared-config/app.config.ts'],
      };
      writeFileSync(tsConfigPath, `${JSON.stringify(config, null, 2)}\n`);
      replaceInFile(main, './app/app.config', '@shared/config');
    },
  },
  {
    name: 'decoy-variable',
    holder: 'app/app.config.ts',
    arrange: ({ sourceRoot }) => {
      replaceInFile(
        join(sourceRoot, 'app', 'app.config.ts'),
        'export const appConfig',
        'export const decoy: ApplicationConfig = { providers: [] };\n\nexport const appConfig',
      );
    },
  },
];

const INLINE_PROVIDE = ['--provide-inline', '--split-registrations=false'];

/** Layouts run with the default registrations, and the ones listed here too. */
const ROOT_CONFIG_RUNS = [
  ...ROOT_CONFIG_LAYOUTS.map((layout) => ({ ...layout, args: [] })),
  { name: 'inline-provide', holder: 'app/app.config.ts', args: INLINE_PROVIDE },
  {
    name: 'split-provide-inline',
    holder: 'app/app.config.ts',
    args: ['--provide-inline'],
  },
  {
    name: 'config-in-provider-file',
    holder: 'app/formbar.config.ts',
    holds: 'SliderControl',
    args: ['--registration-style=config', '--split-registrations=false'],
  },
  {
    name: 'inline-provide-config',
    holder: 'app/app.config.ts',
    args: ['--registration-style=config', ...INLINE_PROVIDE],
  },
  {
    ...ROOT_CONFIG_LAYOUTS[0],
    name: 'inline-object-inline-provide-config',
    args: ['--registration-style=config', ...INLINE_PROVIDE],
  },
];

function runRootConfigFlow(appDir) {
  for (const {
    name,
    holder,
    holds = 'provideFormbar(',
    keeps,
    arrange,
    args,
  } of ROOT_CONFIG_RUNS) {
    const sourceRoot = join(appDir, 'projects', name, 'src');
    const holderPath = join(sourceRoot, holder);

    run(
      'npx',
      ['ng', 'generate', 'application', name, '--skip-install', '--defaults'],
      appDir,
    );

    arrange?.({
      main: join(sourceRoot, 'main.ts'),
      sourceRoot,
      project: name,
      appDir,
    });

    const kept = keeps && readFileSync(join(appDir, keeps), 'utf8');

    ngAdd(appDir, name, args);
    generate(appDir, name, 'control', ['--key', 'slider']);

    const added = readFileSync(holderPath, 'utf8');

    ngAdd(appDir, name, args);
    run('npx', ['ng', 'build', name], appDir);

    console.log(`${name} assertions:`);

    check(added.includes(holds), `${name}: ${holder} holds ${holds}`);
    check(
      !keeps || readFileSync(join(appDir, keeps), 'utf8') === kept,
      `${name}: ng add left ${keeps ?? 'other files'} alone`,
    );
    check(
      readFileSync(holderPath, 'utf8') === added,
      `${name}: re-running ng add kept ${holder}`,
    );
    check(
      readFileSync(
        join(sourceRoot, 'app', 'types', 'content.type.ts'),
        'utf8',
      ).includes('SliderControlConfig'),
      `${name}: the generator found the config ng add wrote`,
    );
  }
}

/**
 * `ng new --no-standalone` has no app config, so the providers go into the root
 * NgModule, with the registrations in their own files and in the module itself.
 */
function runNgModuleFlow(appParent, tarballs) {
  const appDir = createApp('ng-module', appParent, ['--no-standalone']);
  const inlineProject = 'inline-module-app';

  run(
    'npm',
    [
      'install',
      tarballs.get(CORE_PACKAGE_NAME),
      tarballs.get(REACTIVE_FORMS_PACKAGE_NAME),
    ],
    appDir,
  );
  run(
    'npm',
    ['install', '--save-dev', tarballs.get(SCHEMATICS_PACKAGE_NAME)],
    appDir,
  );

  ngAdd(appDir, 'ng-module');
  generate(appDir, 'ng-module', 'control', ['--key', 'slider']);
  run('npx', ['ng', 'build', 'ng-module'], appDir);

  run(
    'npx',
    [
      'ng',
      'generate',
      'application',
      inlineProject,
      '--no-standalone',
      '--skip-install',
      '--defaults',
    ],
    appDir,
  );
  ngAdd(appDir, inlineProject, ['--split-registrations=false']);
  generate(appDir, inlineProject, 'control', ['--key', 'slider']);
  run('npx', ['ng', 'build', inlineProject], appDir);

  const barrelProject = 'barrel-module-app';
  const barrelSourceRoot = join(appDir, 'projects', barrelProject, 'src');
  const barrelModulePath = join(barrelSourceRoot, 'app', 'app-module.ts');

  run(
    'npx',
    [
      'ng',
      'generate',
      'application',
      barrelProject,
      '--no-standalone',
      '--skip-install',
      '--defaults',
    ],
    appDir,
  );
  writeFileSync(
    join(barrelSourceRoot, 'app', 'index.ts'),
    `export * from './app-module';\n`,
  );
  replaceInFile(join(barrelSourceRoot, 'main.ts'), './app/app-module', './app');
  replaceInFile(barrelModulePath, /providers: \[[^\]]*\]/, 'providers: SHARED');
  replaceInFile(
    barrelModulePath,
    '@NgModule(',
    'const SHARED = [provideBrowserGlobalErrorListeners()];\n\n@NgModule(',
  );
  ngAdd(appDir, barrelProject);
  run('npx', ['ng', 'build', barrelProject], appDir);

  console.log('NgModule assertions:');

  check(
    /providers: \[\s*SHARED,/.test(readFileSync(barrelModulePath, 'utf8')),
    'ng add followed a barrel to the root NgModule and kept its providers in an array',
  );

  const rootModule = readFileSync(
    join(appDir, 'src', 'app', 'app-module.ts'),
    'utf8',
  );
  const inlineModule = readFileSync(
    join(appDir, 'projects', inlineProject, 'src', 'app', 'app-module.ts'),
    'utf8',
  );

  check(
    rootModule.includes('provideFormbar(') &&
      rootModule.includes('componentRegistrationsProvider'),
    'ng add provided formbar in the root NgModule',
  );
  check(
    readFileSync(
      join(appDir, 'src', 'app', 'registrations', 'component-registrations.ts'),
      'utf8',
    ).includes('SliderControl'),
    'the scaffold registered into the split registrations of an NgModule app',
  );
  check(
    inlineModule.includes('SliderControl'),
    'the scaffold registered into an NgModule holding the registrations',
  );

  return appDir;
}

/**
 * Without the schematics package in package.json, as a consumer starts out.
 * The dry run leaves node_modules alone, so package.json alone gets restored.
 */
function runDevDependencyFlow(appDir) {
  const project = 'dev-dependency-app';
  const manifestPath = join(appDir, 'package.json');
  const original = readFileSync(manifestPath, 'utf8');
  const withoutSchematics = JSON.parse(original);

  delete withoutSchematics.devDependencies[SCHEMATICS_PACKAGE_NAME];

  run(
    'npx',
    ['ng', 'generate', 'application', project, '--skip-install', '--defaults'],
    appDir,
  );
  writeFileSync(
    manifestPath,
    `${JSON.stringify(withoutSchematics, null, 2)}\n`,
  );

  ngAdd(appDir, project);

  const manifest = readJson(manifestPath);

  writeFileSync(manifestPath, original);

  console.log('dev dependency assertions:');

  check(
    /^\^/.test(manifest.devDependencies?.[SCHEMATICS_PACKAGE_NAME] ?? ''),
    'ng add saved the schematics package as a dev dependency',
  );
  check(
    !manifest.dependencies?.[SCHEMATICS_PACKAGE_NAME],
    'ng add did not save the schematics package as a dependency',
  );
}

/**
 * Without a schematics configuration file, the generators only get what ng add
 * wrote to angular.json through the CLI, which validates it against each schema.
 */
function runAngularJsonDefaultsFlow(appDir) {
  const project = 'angular-json-app';
  const sourceRoot = join(appDir, 'projects', project, 'src');
  const registrationsPath = join(
    sourceRoot,
    'app',
    'forms',
    'component-registrations.ts',
  );

  run(
    'npx',
    ['ng', 'generate', 'application', project, '--skip-install', '--defaults'],
    appDir,
  );

  ngAdd(appDir, project, [
    '--use-schematic-config=false',
    '--registration-style=config',
    '--registrations-path=app/forms',
  ]);
  generate(appDir, project, 'control', ['--key', 'slider']);
  generate(appDir, project, 'block', ['--key', 'note']);
  generate(appDir, project, 'control', [
    '--key',
    'rating',
    '--skip-registration',
  ]);

  const registeredByControl = readFileSync(registrationsPath, 'utf8');

  generate(appDir, project, 'register');
  run('npx', ['ng', 'build', project], appDir);

  console.log('angular.json defaults assertions:');

  const registered = readFileSync(registrationsPath, 'utf8');

  check(
    !existsSync(join(sourceRoot, 'app', 'formbar-schematic.config.json')),
    'ng add wrote no schematics configuration file',
  );
  check(
    /["']?slider["']?:\s*loadComponent\(/.test(registeredByControl),
    'control registered as the angular.json defaults say',
  );
  check(
    /["']?note["']?:\s*loadComponent\(/.test(registeredByControl),
    'block took the angular.json defaults',
  );
  check(
    !registeredByControl.includes('RatingControl') &&
      registered.includes('RatingControl'),
    'register found the control and the file through the angular.json defaults',
  );
}

function generateFailure(cwd, project, args) {
  return spawnSync(
    'npx',
    [
      'ng',
      'generate',
      `${SCHEMATICS_PACKAGE_NAME}:control`,
      '--project',
      project,
      ...args,
    ],
    {
      cwd,
      encoding: 'utf8',
      env: { ...process.env, CI: 'true', NG_CLI_ANALYTICS: 'false' },
    },
  );
}

/**
 * The tables of "Where Components Go". `from` is the directory the command runs
 * in, relative to the app, and `expected` where the component's folder ends up.
 */
function checkPathRows(appDir, project, rows) {
  for (const { key, from = '', path, expected } of rows) {
    const cwd = join(appDir, from);

    mkdirSync(cwd, { recursive: true });
    generate(cwd, project, 'control', [
      '--key',
      key,
      '--skip-registration',
      ...(path ? ['--path', path] : []),
    ]);

    check(
      existsSync(join(appDir, expected, key, `${key}-control.ts`)),
      `${project}: ${path ? `--path ${path}` : `running from "${from}"`} writes to ${expected}/${key}`,
    );
  }
}

function runProjectPathFlow(appDir) {
  const project = 'path-table-app';
  const other = 'other-table-app';
  const sourceRoot = `projects/${project}/src`;

  for (const name of [project, other]) {
    run(
      'npx',
      ['ng', 'generate', 'application', name, '--skip-install', '--defaults'],
      appDir,
    );
  }
  ngAdd(appDir, project);

  console.log('--path in a project of its own assertions:');

  checkPathRows(appDir, project, [
    { key: 'alpha', expected: `${sourceRoot}/app` },
    {
      key: 'bravo',
      from: `${sourceRoot}/app/forms`,
      expected: `${sourceRoot}/app/forms`,
    },
    {
      key: 'charlie',
      path: `projects/${project}/tools`,
      expected: `projects/${project}/tools`,
    },
    { key: 'delta', path: 'forms', expected: `${sourceRoot}/forms` },
    { key: 'echo', path: '/forms', expected: 'forms' },
  ]);

  for (const path of [`projects/${other}/forms`, `/projects/${other}/forms`]) {
    const { status, stderr, stdout } = generateFailure(appDir, project, [
      '--key',
      'foxtrot',
      '--skip-registration',
      '--path',
      path,
    ]);

    check(
      status !== 0 &&
        `${stdout}${stderr}`.includes('lies inside another project'),
      `${project}: --path ${path} fails naming the other project`,
    );
  }
}

/** The default `ng new` layout, where the project is the workspace root. */
function runRootProjectPathFlow(appDir, project) {
  console.log('--path at the workspace root assertions:');

  checkPathRows(appDir, project, [
    { key: 'alpha', expected: 'src/app' },
    { key: 'bravo', from: 'src/app/forms', expected: 'src/app/forms' },
    { key: 'charlie', path: 'src/app/forms', expected: 'src/app/forms' },
    { key: 'delta', path: 'app/forms', expected: 'app/forms' },
    { key: 'echo', path: '/forms', expected: 'forms' },
  ]);
}

function runNgAddFlow(appParent, tarballs) {
  const appDir = createApp('formbar', appParent);

  run(
    'npm',
    [
      'install',
      tarballs.get(CORE_PACKAGE_NAME),
      tarballs.get(REACTIVE_FORMS_PACKAGE_NAME),
    ],
    appDir,
  );
  run(
    'npm',
    ['install', '--save-dev', tarballs.get(SCHEMATICS_PACKAGE_NAME)],
    appDir,
  );

  ngAdd(appDir, 'formbar');
  generate(appDir, 'formbar', 'control', ['--key', 'phoneNumber']);
  generate(appDir, 'formbar', 'group', ['--key', 'address']);

  // The CLI hands --path the directory the command runs in.
  const featuresDir = join(appDir, 'src', 'app', 'features');
  mkdirSync(featuresDir, { recursive: true });
  generate(featuresDir, 'formbar', 'control', ['--key', 'rating']);

  const unionPath = join(appDir, 'src', 'app', 'types', 'content.type.ts');
  const scaffoldedUnion = readFileSync(unionPath, 'utf8');

  ngAdd(appDir, 'formbar');
  generate(appDir, 'formbar', 'schema');
  run('npx', ['ng', 'build'], appDir);

  console.log('ng add flow assertions:');

  const interfacePath = findFile(
    join(appDir, 'src'),
    'phone-number-control-config.ts',
  );

  check(
    interfacePath !== null &&
      basename(dirname(interfacePath)) === 'phone-number',
    'the camelCase key was scaffolded into a dasherized directory',
  );
  check(
    /import \{ PhoneNumberControlConfig \} from '[./]+\/phone-number\/phone-number-control-config';/.test(
      scaffoldedUnion,
    ),
    'the union imports the camelCase scaffold from where it was written',
  );
  check(
    existsSync(join(featuresDir, 'rating', 'rating-control.ts')),
    'a generator run from a subdirectory wrote into that subdirectory',
  );
  check(
    scaffoldedUnion.includes('AddressGroupConfig<AppContent>'),
    'the scaffolded group joined the union with the union as its content',
  );
  check(
    readFileSync(unionPath, 'utf8') === scaffoldedUnion,
    're-running ng add kept the scaffolded union',
  );

  const schemaPath = join(appDir, 'src', 'form.schema.json');
  check(
    existsSync(schemaPath),
    'schema wrote the seeded 2020-12 emitter output',
  );

  if (existsSync(schemaPath)) {
    const validate = new Ajv2020({ strict: false }).compile(
      readJson(schemaPath),
    );

    check(
      validate(SCAFFOLDED_FORM) === true,
      'the generated schema accepts a config using both scaffolds',
    );
    check(
      validate(UNKNOWN_TYPE_FORM) === false,
      'the generated schema rejects a type nothing was scaffolded for',
    );
  }

  runRootProjectPathFlow(appDir, 'formbar');

  return appDir;
}

function main() {
  const stagingDir = mkdtempSync(join(tmpdir(), 'formbar-e2e-pack-'));
  const appParent = mkdtempSync(join(tmpdir(), 'formbar-e2e-app-'));
  const appDir = join(appParent, 'consumer');

  console.log(`staging: ${stagingDir}`);
  console.log(`app:     ${appDir}`);

  run(
    'pnpm',
    [
      'nx',
      'run-many',
      '-t',
      'build',
      'clean-schematics',
      '-p',
      ...PACKAGES.map((name) => `@ngx-formbar/${name}`),
    ],
    WORKSPACE_ROOT,
  );

  const tarballs = new Map();
  const versions = new Map();
  let schematicsFiles = [];

  for (const name of PACKAGES) {
    const { staged, manifest } = stagePackage(
      name,
      stagingDir,
      tarballs,
      versions,
    );
    const { tarball, files } = packPackage(staged, stagingDir);

    tarballs.set(manifest.name, tarball);
    versions.set(manifest.name, manifest.version);

    if (manifest.name === REACTIVE_FORMS_PACKAGE_NAME) {
      check(
        /^\^\d/.test(manifest.peerDependencies[CORE_PACKAGE_NAME]),
        `the staged manifest declares core in a caret range: ${manifest.peerDependencies[CORE_PACKAGE_NAME]}`,
      );
    }

    if (manifest.name === SCHEMATICS_PACKAGE_NAME) {
      schematicsFiles = files;
    }
  }

  createApp('consumer', appParent);
  run('npm', ['install', tarballs.get(CORE_PACKAGE_NAME)], appDir);
  run(
    'npm',
    ['install', '--save-dev', tarballs.get(SCHEMATICS_PACKAGE_NAME)],
    appDir,
  );

  writeConsumerFixture(appDir);

  const { combined: output } = run(
    'npx',
    [
      'ng',
      'generate',
      `${SCHEMATICS_PACKAGE_NAME}:schema`,
      '--project',
      'consumer',
    ],
    appDir,
  );

  console.log(output);
  console.log('assertions:');

  const modernPath = join(appDir, 'src', 'form.schema.json');
  const legacyPath = join(appDir, 'src', 'form.draft-07.schema.json');
  const inventoryPath = join(appDir, 'src', 'inventory.json');

  check(existsSync(modernPath), 'the 2020-12 emitter wrote its schema');
  check(existsSync(legacyPath), 'the draft-07 emitter wrote its schema');
  check(existsSync(inventoryPath), 'the local .ts emitter wrote its output');
  checkPackedFiles(schematicsFiles);

  const coreRoot = readLoggedCoreRoot(output);
  check(coreRoot !== null, 'the run reported which core it resolved');
  check(
    output.includes(
      'Using schematics configuration file /src/app/formbar-schematic.config.json',
    ),
    'the run reported which schematics configuration file it used',
  );

  if (coreRoot) {
    checkCoreRoot(coreRoot, appDir);
  }

  if (failures.length === 0) {
    const modern = readJson(modernPath);
    const legacy = readJson(legacyPath);

    check(
      modern.$schema === DRAFT_2020_12,
      'the 2020-12 schema declares its dialect',
    );
    check(
      legacy.$schema === DRAFT_07,
      'the draft-07 schema declares its dialect',
    );
    check(
      modern.$defs?.TextControl?.properties?.label?.description ===
        'Static label for the control.',
      'a property inherited from the installed core carries its doc comment',
    );
    check(
      modern.$defs?.TextControl?.properties?.maxLength?.description ===
        'Longest value the input accepts.',
      'a property declared by the consumer carries its doc comment',
    );
    check(
      Array.isArray(modern.$defs?.RepeatArray?.properties?.rowControl?.allOf),
      "the array row applies core's hideStrategy narrowing at the reference",
    );

    validateWith(new Ajv2020({ strict: false }), modern, 'draft 2020-12');
    validateWith(new Ajv({ strict: false }), legacy, 'draft-07');
    checkInventory(readJson(inventoryPath), appDir);
  }

  checkSubdirectoryRun(appDir);
  runLibraryFlow(appDir);
  runLinkedConfigFlow(appDir, tarballs);
  runPathOptionsFlow(appDir);
  runMovedConfigFlow(appDir);
  runRootConfigFlow(appDir);
  runKeptIndexFlow(appDir);

  runDevDependencyFlow(appDir);
  runAngularJsonDefaultsFlow(appDir);
  runProjectPathFlow(appDir);

  const ngModuleAppDir = runNgModuleFlow(appParent, tarballs);
  const formbarAppDir = runNgAddFlow(appParent, tarballs);

  if (failures.length > 0) {
    console.log(
      `\nkept for inspection: ${appDir}, ${ngModuleAppDir} and ${formbarAppDir}`,
    );
    throw new Error(
      `${failures.length} assertion(s) failed:\n  ${failures.join('\n  ')}`,
    );
  }

  rmSync(stagingDir, { recursive: true, force: true });
  rmSync(appParent, { recursive: true, force: true });

  console.log('\nschematics e2e passed.');
}

try {
  main();
} catch (error) {
  console.error(`\n${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
