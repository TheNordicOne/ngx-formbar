import { Rule, SchematicsException, Tree } from '@angular-devkit/schematics';
import { PACKAGE_NAME, PACKAGE_VERSION } from '../constants';

export interface PackageJson {
  dependencies: Record<string, string>;
}

export function addDependencies(): Rule {
  return (tree: Tree) => {
    const pkgPath = 'package.json';
    if (!tree.exists(pkgPath)) {
      throw new SchematicsException(`Could not find ${pkgPath}`);
    }

    const pkgBuffer = tree.read(pkgPath);
    if (!pkgBuffer) {
      throw new SchematicsException(`Could not read ${pkgPath}`);
    }

    const pkgJson = JSON.parse(pkgBuffer.toString('utf-8')) as PackageJson;

    if (!pkgJson.dependencies[PACKAGE_NAME]) {
      pkgJson.dependencies[PACKAGE_NAME] = PACKAGE_VERSION;

      pkgJson.dependencies = Object.keys(pkgJson.dependencies)
        .sort()
        .reduce<Record<string, string>>((sorted, key) => {
          sorted[key] = pkgJson.dependencies[key];
          return sorted;
        }, {});
    }

    tree.overwrite(pkgPath, JSON.stringify(pkgJson, null, 2));
    return tree;
  };
}
