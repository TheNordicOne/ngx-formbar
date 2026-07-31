import { describe, expect, it } from 'vitest';
import {
  normalizePath,
  parseTypeReference,
  splitHashReference,
} from '../shared/type-reference';

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

  it('throws when the reference has no export name after the "#"', () => {
    expect(() => parseTypeReference('app/types/content.type.ts#')).toThrow(
      'Invalid type reference "app/types/content.type.ts#". Expected "path/to/file.ts#ExportName".',
    );
  });

  it('ignores whitespace around the reference', () => {
    expect(
      parseTypeReference('  app/types/content.type.ts#AppContent  '),
    ).toEqual({
      filePath: 'app/types/content.type.ts',
      exportName: 'AppContent',
    });
  });
});

describe('splitHashReference', () => {
  it('splits a reference into a path and an export name', () => {
    expect(
      splitHashReference('shared/helper/view-provider.ts#viewProviders'),
    ).toEqual({
      path: 'shared/helper/view-provider.ts',
      exportName: 'viewProviders',
    });
  });

  it('leaves the export name empty when there is no "#", so a default can supply it', () => {
    expect(splitHashReference('shared/helper')).toEqual({
      path: 'shared/helper',
      exportName: '',
    });
  });

  it('splits on the first "#" only', () => {
    expect(splitHashReference('a.ts#B#C')).toEqual({
      path: 'a.ts',
      exportName: 'B#C',
    });
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
