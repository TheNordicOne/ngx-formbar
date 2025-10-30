import { SchematicsException, Tree } from '@angular-devkit/schematics';
import {
  DEFAULT_COMPONENT_REGISTRATIONS_FILE_NAME,
  DEFAULT_REGISTRATIONS_PATH,
  DEFAULT_SCHEMATIC_CONFIG_FILE_NAME,
  DEFAULT_SCHEMATICS_CONFIG_PATH,
} from '../../shared/constants';

export function findConfigPath(tree: Tree, sourceRoot: string): string | null {
  const candidates = [
    `/${sourceRoot}/${DEFAULT_REGISTRATIONS_PATH}/${DEFAULT_COMPONENT_REGISTRATIONS_FILE_NAME}`,
    `/${sourceRoot}/app/formbar.config.ts`,
    `/${sourceRoot}/app/app.config.ts`,
  ];

  return candidates.find((p) => tree.exists(p)) ?? null;
}

export function findSchematicsConfig(tree: Tree): string | null {
  const configPath = `/${DEFAULT_SCHEMATICS_CONFIG_PATH}/${DEFAULT_SCHEMATIC_CONFIG_FILE_NAME}`;

  if (tree.exists(configPath)) {
    return configPath;
  }

  const files = tree.root.subfiles.filter(
    (file) => file === DEFAULT_SCHEMATIC_CONFIG_FILE_NAME,
  );

  if (files.length > 0) {
    return `/${files[0]}`;
  }

  const searchInDirectory = (dir: string): string | null => {
    const currentPath = dir ? `/${dir}` : '';

    const configFile = tree.exists(
      `${currentPath}/${DEFAULT_SCHEMATIC_CONFIG_FILE_NAME}`,
    )
      ? `${currentPath}/${DEFAULT_SCHEMATIC_CONFIG_FILE_NAME}`
      : null;

    if (configFile) {
      return configFile;
    }

    // Try to find in subdirectories
    const subdirs = tree.getDir(currentPath).subdirs;

    for (const subdir of subdirs) {
      const foundInSubdir = searchInDirectory(
        `${dir ? `${dir}/` : ''}${subdir}`,
      );
      if (foundInSubdir) {
        return foundInSubdir;
      }
    }

    return null;
  };

  return searchInDirectory('');
}

export function readFile<T>(tree: Tree, path?: string | null): T | null {
  if (!path) {
    return null;
  }
  if (!tree.exists(path)) {
    return null;
  }
  const buf = tree.read(path);
  if (!buf) {
    throw new SchematicsException(`Could not read ${path}`);
  }

  const text = buf.toString('utf-8');

  return JSON.parse(text) as T;
}
