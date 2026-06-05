import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  AsyncValidatorFn,
  FormControl,
  FormGroup,
  ValidatorFn,
} from '@angular/forms';
import { NgxFbItem } from '@ngx-formbar/core';
import { RowFactoryService } from './row-factory.service';
import { NGX_VALIDATOR_RESOLVER } from '../tokens/validator-resolver';
import { ValidatorResolver } from '../types/validator-resolver.type';

function createFactory(): RowFactoryService {
  const resolver: ValidatorResolver = {
    registrations: signal(new Map<string, ValidatorFn[]>()),
    asyncRegistrations: signal(new Map<string, AsyncValidatorFn[]>()),
  };
  TestBed.configureTestingModule({
    providers: [{ provide: NGX_VALIDATOR_RESOLVER, useValue: resolver }],
  });
  return TestBed.inject(RowFactoryService);
}

describe('RowFactoryService', () => {
  it('builds a FormControl for a plain control row', () => {
    const row = createFactory().build({ type: 'text', label: 'Tag' });
    expect(row).toBeInstanceOf(FormControl);
  });

  it('builds a FormGroup for a group row and skips block children', () => {
    const row = createFactory().build({
      type: 'group',
      controls: {
        name: { type: 'text', label: 'Name' },
        divider: { type: 'divider', isControl: false },
      },
    });

    expect(row).toBeInstanceOf(FormGroup);
    const group = row as FormGroup;
    expect(group.get('name')).toBeInstanceOf(FormControl);
    // A block carries no control, so it never joins the row's FormGroup.
    expect(group.get('divider')).toBeNull();
  });

  it('rejects a block as the row top instead of building a phantom control', () => {
    const block: NgxFbItem = { type: 'divider', isControl: false };
    expect(() => createFactory().build(block)).toThrow(/block/i);
  });

  it("rejects hideStrategy 'remove' on the row top", () => {
    expect(() =>
      createFactory().build({ type: 'text', hideStrategy: 'remove' }),
    ).toThrow(/hideStrategy/i);
  });
});
