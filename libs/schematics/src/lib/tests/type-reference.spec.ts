import { describe, expect, it } from 'vitest';
import { normalizePath, parseTypeReference } from '../shared/type-reference';

describe('parseTypeReference', () => {
  it('parses a valid reference into a file path and export name', () => {
    expect(parseTypeReference('app/types/content.type.ts#AppContent')).toEqual({
      filePath: 'app/types/content.type.ts',
      exportName: 'AppContent',
    });
  });

  it('throws when the reference has no "#"', () => {
    expect(() => parseTypeReference('app/types/content.type.ts')).toThrow(
      'Invalid type reference "app/types/content.type.ts". Expected "path/to/file.ts#ExportName".',
    );
  });
});

describe('normalizePath', () => {
  it('collapses a "." segment', () => {
    expect(normalizePath('/projects/test-app/src/./app/content.ts')).toBe(
      '/projects/test-app/src/app/content.ts',
    );
  });

  it('collapses a ".." segment', () => {
    expect(normalizePath('/projects/test-app/src/../shared/content.ts')).toBe(
      '/projects/test-app/shared/content.ts',
    );
  });
});
