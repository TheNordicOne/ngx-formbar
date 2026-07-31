/**
 * Runs the `schema` schematic the way a consumer does: packed tarballs,
 * installed into a fresh Angular app outside this repository, driven through
 * the real Angular CLI. Every other test in this library runs inside this
 * workspace against a hand-written core stub in a virtual Tree, which is the
 * shape of test that passes while the shipped artifact is broken.
 */
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import Ajv from 'ajv';
import Ajv2020 from 'ajv/dist/2020.js';

const WORKSPACE_ROOT = process.cwd();
const PACKAGES = ['core', 'setup', 'schematics'];
const CORE_PACKAGE_NAME = '@ngx-formbar/core';
const SCHEMATICS_PACKAGE_NAME = '@ngx-formbar/schematics';
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

/** Static text rendered between controls. */
export interface NoteBlock extends NgxFbBlock {
  type: 'note';
  text: string;
}

/**
 * Every form node type this app supports.
 * The \`schema\` schematic reads this union; scaffolding a control adds to it.
 */
export type AppContent = TextControl | SectionGroup | RepeatArray | NoteBlock;
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

const SCHEMATIC_CONFIG = {
  schema: {
    type: 'app/types/content.type.ts#AppContent',
    docs: true,
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

const failures = [];

function check(condition, description) {
  if (condition) {
    console.log(`  ok    ${description}`);
    return;
  }

  failures.push(description);
  console.log(`  FAIL  ${description}`);
}

function run(command, args, cwd) {
  const started = Date.now();
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, CI: 'true', NG_CLI_ANALYTICS: 'false' },
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
 * the sibling tarball takes that role, so the manifest a consumer installs is
 * the built one and not a hand-assembled node_modules.
 */
function stagePackage(name, stagingDir, tarballs) {
  const staged = join(stagingDir, name);
  cpSync(join(WORKSPACE_ROOT, 'dist', 'libs', name), staged, {
    recursive: true,
  });

  const manifestPath = join(staged, 'package.json');
  const manifest = readJson(manifestPath);

  for (const [dependency, range] of Object.entries(
    manifest.dependencies ?? {},
  )) {
    if (typeof range === 'string' && range.startsWith('workspace:')) {
      manifest.dependencies[dependency] = `file:${tarballs.get(dependency)}`;
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
}

function checkInventory(inventory, appDir) {
  const kinds = inventory.nodes.map((node) => node.kind).sort();
  const names = inventory.nodes.map((node) => node.name).sort();
  const array = inventory.nodes.find((node) => node.kind === 'array');
  const group = inventory.nodes.find((node) => node.kind === 'group');

  check(
    JSON.stringify(kinds) ===
      JSON.stringify(['array', 'block', 'control', 'group']),
    'the local emitter saw all four node kinds',
  );
  check(
    JSON.stringify(names) ===
      JSON.stringify([
        'NoteBlock',
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
      '-p',
      ...PACKAGES.map((name) => `@ngx-formbar/${name}`),
    ],
    WORKSPACE_ROOT,
  );

  const tarballs = new Map();
  let schematicsFiles = [];

  for (const name of PACKAGES) {
    const { staged, manifest } = stagePackage(name, stagingDir, tarballs);
    const { tarball, files } = packPackage(staged, stagingDir);

    tarballs.set(manifest.name, tarball);

    if (manifest.name === SCHEMATICS_PACKAGE_NAME) {
      schematicsFiles = files;
    }
  }

  run(
    'npx',
    [
      '--yes',
      '@angular/cli@21',
      'new',
      'consumer',
      '--skip-git',
      '--skip-install',
      '--defaults',
      '--package-manager',
      'npm',
    ],
    appParent,
  );

  run('npm', ['install'], appDir);
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

  if (failures.length > 0) {
    console.log(`\nkept for inspection: ${appDir}`);
    throw new Error(
      `${failures.length} assertion(s) failed:\n  ${failures.join('\n  ')}`,
    );
  }

  rmSync(stagingDir, { recursive: true, force: true });
  rmSync(appParent, { recursive: true, force: true });

  console.log('\nschema e2e passed.');
}

try {
  main();
} catch (error) {
  console.error(`\n${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
