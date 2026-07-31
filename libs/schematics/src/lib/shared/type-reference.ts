import { SchematicsException } from '@angular-devkit/schematics';
import { posix } from 'node:path';

/**
 * Splits a "path/to/file.ts#ExportName" config value on its first "#". This is
 * the single answer to what "#" means in a config value, shared by
 * `schema.type` and `viewProviderHelperPath`. The export name is left empty
 * when there is no "#", so a caller holding a default can supply one.
 *
 * Pure string parsing with no Tree or TypeScript program access, so both the
 * `schema` schematic and the scaffold rules can depend on it without either
 * pulling the other's machinery in.
 */
export function splitHashReference(reference: string): {
  path: string;
  exportName: string;
} {
  const trimmed = reference.trim();
  const hashIndex = trimmed.indexOf('#');

  if (hashIndex < 0) {
    return { path: trimmed, exportName: '' };
  }

  return {
    path: trimmed.slice(0, hashIndex),
    exportName: trimmed.slice(hashIndex + 1),
  };
}

/** The variant for callers with no default to fall back on. */
export function parseTypeReference(reference: string): {
  filePath: string;
  exportName: string;
} {
  const { path, exportName } = splitHashReference(reference);

  if (!path || !exportName) {
    throw new SchematicsException(
      `Invalid type reference "${reference}". Expected "path/to/file.ts#ExportName".`,
    );
  }

  return { filePath: path, exportName };
}

/**
 * Collapses "." and ".." segments so every reader of the same config value —
 * the Tree, TypeScript's directory-walking module resolution, and Angular's
 * `buildRelativePath` — agrees on the same canonical spelling.
 */
export function normalizePath(fileName: string): string {
  return posix.resolve('/', fileName);
}
