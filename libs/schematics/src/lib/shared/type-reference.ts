import { SchematicsException } from '@angular-devkit/schematics';
import { posix } from 'node:path';

/**
 * Splits a "path/to/file.ts#ExportName" config value into its parts. Pure
 * string parsing with no Tree or TypeScript program access, so both the
 * `schema` schematic and the scaffold rules can depend on it without either
 * pulling the other's machinery in.
 */
export function parseTypeReference(reference: string): {
  filePath: string;
  exportName: string;
} {
  const [filePath, exportName] = reference.split('#');

  if (!filePath || !exportName) {
    throw new SchematicsException(
      `Invalid type reference "${reference}". Expected "path/to/file.ts#ExportName".`,
    );
  }

  return { filePath, exportName };
}

/**
 * Collapses "." and ".." segments so every reader of the same config value —
 * the Tree, TypeScript's directory-walking module resolution, and Angular's
 * `buildRelativePath` — agrees on the same canonical spelling.
 */
export function normalizePath(fileName: string): string {
  return posix.resolve('/', fileName);
}
