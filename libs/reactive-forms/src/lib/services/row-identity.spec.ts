import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { rowIdentityFactory } from './row-identity';

function row() {
  return new FormGroup({ email: new FormControl('') });
}

describe('rowIdentityFactory', () => {
  it('returns the path as it is without a root', () => {
    expect(rowIdentityFactory().stablePath(null, 'list.0.email')).toBe(
      'list.0.email',
    );
  });

  it('leaves a path without arrays untouched', () => {
    const root = new FormGroup({
      group: new FormGroup({ field: new FormControl('') }),
    });

    expect(rowIdentityFactory().stablePath(root, 'group.field')).toBe(
      'group.field',
    );
  });

  it('numbers the rows in the order it first sees them', () => {
    const root = new FormGroup({ list: new FormArray([row(), row()]) });
    const identity = rowIdentityFactory();

    expect(identity.stablePath(root, 'list.1.email')).toBe('list.row1.email');
    expect(identity.stablePath(root, 'list.0.email')).toBe('list.row2.email');
  });

  it('keeps the id of a row', () => {
    const root = new FormGroup({ list: new FormArray([row()]) });
    const identity = rowIdentityFactory();

    expect(identity.stablePath(root, 'list.0')).toBe('list.row1');
    expect(identity.stablePath(root, 'list.0')).toBe('list.row1');
  });

  it('lets the id follow a row that moved', () => {
    const list = new FormArray([row(), row()]);
    const root = new FormGroup({ list });
    const identity = rowIdentityFactory();
    const first = identity.stablePath(root, 'list.0.email');

    const moved = list.at(0);
    list.removeAt(0);
    list.push(moved);

    expect(identity.stablePath(root, 'list.1.email')).toBe(first);
  });

  it('rewrites arrays in arrays', () => {
    const root = new FormGroup({
      list: new FormArray([new FormArray([row()])]),
    });

    expect(rowIdentityFactory().stablePath(root, 'list.0.0.email')).toBe(
      'list.row1.row2.email',
    );
  });

  it('counts per factory', () => {
    const root = new FormGroup({ list: new FormArray([row()]) });

    rowIdentityFactory().stablePath(root, 'list.0');

    expect(rowIdentityFactory().stablePath(root, 'list.0')).toBe('list.row1');
  });

  it.each(['1', '-1', 'x'])('keeps %s, which is no row', (index) => {
    const root = new FormGroup({ list: new FormArray([row()]) });

    expect(rowIdentityFactory().stablePath(root, `list.${index}.email`)).toBe(
      `list.${index}.email`,
    );
  });

  it('accepts the last row', () => {
    const root = new FormGroup({ list: new FormArray([row(), row()]) });

    expect(rowIdentityFactory().stablePath(root, 'list.1')).toBe('list.row1');
  });

  it('keeps the rest of a path behind a missing group', () => {
    const root = new FormGroup({ list: new FormArray([row()]) });

    expect(rowIdentityFactory().stablePath(root, 'missing.0')).toBe(
      'missing.0',
    );
  });

  it('keeps the rest of a path behind a control', () => {
    const root = new FormGroup({ field: new FormControl('') });

    expect(rowIdentityFactory().stablePath(root, 'field.0')).toBe('field.0');
  });
});
