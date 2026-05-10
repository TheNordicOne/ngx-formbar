import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dirs = [
  'dist/libs/core',
  'dist/libs/reactive-forms',
  'dist/libs/schematics',
  'dist/libs/setup',
];

const versions = new Map();
for (const dir of dirs) {
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  versions.set(pkg.name, pkg.version);
}

for (const dir of dirs) {
  const pkgPath = join(dir, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  let changed = false;

  for (const section of ['dependencies', 'peerDependencies']) {
    if (!pkg[section]) continue;
    for (const [dep, range] of Object.entries(pkg[section])) {
      if (
        typeof range === 'string' &&
        range.startsWith('workspace:') &&
        versions.has(dep)
      ) {
        pkg[section][dep] = '^' + versions.get(dep);
        changed = true;
      }
    }
  }

  if (changed) {
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log('Resolved workspace protocols in ' + pkgPath);
  }
}
