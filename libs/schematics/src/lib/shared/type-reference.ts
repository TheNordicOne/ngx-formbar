import { SchematicsException } from '@angular-devkit/schematics';
import { resolveWithinWorkspace } from '@ngx-formbar/setup';

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

  return hashIndex < 0
    ? { path: trimmed, exportName: '' }
    : {
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

export function resolveTypeFile(filePath: string, sourceRoot: string): string {
  const resolved = resolveWithinWorkspace(filePath, sourceRoot);

  if (!resolved) {
    throw new SchematicsException(`Type file not found: ${filePath}`);
  }

  return resolved;
}
