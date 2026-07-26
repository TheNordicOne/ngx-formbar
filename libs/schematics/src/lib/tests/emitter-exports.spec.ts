import { describe, expect, it } from 'vitest';
import * as index from '../../index';
import { OWN_EXPORTS } from '../schema/emitter/load';

/**
 * Runtime exports deliberately withheld from emitters: these are the schematic rule
 * factories the Angular CLI invokes through `collection.json`, not helpers an emitter
 * has any use for. Everything else the package exports at runtime must be served.
 */
const NOT_EXPOSED_TO_EMITTERS = [
  'control',
  'group',
  'block',
  'register',
  'schema',
];

describe('the runtime surface served to emitters', () => {
  it('accounts for every runtime export of the package', () => {
    const unaccounted = runtimeExportNames().filter(
      (name) =>
        !Object.prototype.hasOwnProperty.call(OWN_EXPORTS, name) &&
        !NOT_EXPOSED_TO_EMITTERS.includes(name),
    );

    expect(unaccounted).toEqual([]);
  });

  it('withholds only names the package still exports', () => {
    const stale = NOT_EXPOSED_TO_EMITTERS.filter(
      (name) => !runtimeExportNames().includes(name),
    );

    expect(stale).toEqual([]);
  });
});

function runtimeExportNames(): string[] {
  return Object.keys(index);
}
