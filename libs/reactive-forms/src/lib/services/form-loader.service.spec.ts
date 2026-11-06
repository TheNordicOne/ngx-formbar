import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  AsyncValidatorFn,
  FormArray,
  FormControl,
  FormGroup,
  ValidatorFn,
} from '@angular/forms';
import { NgxFbForm } from '@ngx-formbar/core';
import { NGX_VALIDATOR_RESOLVER } from '../tokens/validator-resolver';
import { FormLoaderService } from './form-loader.service';

const rowControl = {
  type: 'group',
  title: 'Row',
  controls: { email: { type: 'text', label: 'Email' } },
};

const config = {
  content: {
    list: { type: 'array', isFormArray: true, rowControl },
    group: {
      type: 'group',
      title: 'Group',
      controls: {
        inner: { type: 'array', isFormArray: true, rowControl },
      },
    },
    field: { type: 'text', label: 'Field' },
    missing: { type: 'text', label: 'Missing' },
  },
} as unknown as NgxFbForm;

describe('FormLoaderService', () => {
  let service: FormLoaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: NGX_VALIDATOR_RESOLVER,
          useValue: {
            registrations: signal(new Map<string, ValidatorFn[]>()),
            asyncRegistrations: signal(new Map<string, AsyncValidatorFn[]>()),
          },
        },
      ],
    });
    service = TestBed.inject(FormLoaderService);
  });

  function form(rows = 0) {
    const row = () =>
      new FormGroup({ email: new FormControl<string | null>(null) });
    return new FormGroup({
      list: new FormArray(Array.from({ length: rows }, row)),
      group: new FormGroup({ inner: new FormArray<FormGroup>([]) }),
      field: new FormControl<string | null>(null),
    });
  }

  it('grows an array to the data and applies the values', () => {
    const root = form();

    service.load(root, config, { list: [{ email: 'a' }, { email: 'b' }] });

    expect(root.controls.list.getRawValue()).toEqual([
      { email: 'a' },
      { email: 'b' },
    ]);
  });

  it('shrinks an array to the data', () => {
    const root = form(3);

    service.load(root, config, { list: [{ email: 'a' }] });

    expect(root.controls.list.length).toBe(1);
  });

  it.each([[undefined], [null]])(
    'empties an array when the data holds %j',
    (list) => {
      const root = form(2);

      service.load(root, config, { list });

      expect(root.controls.list.length).toBe(0);
    },
  );

  it('sizes an array inside a group', () => {
    const root = form();

    service.load(root, config, { group: { inner: [{ email: 'a' }] } });

    expect(root.controls.group.controls.inner.length).toBe(1);
  });

  it.each([[null], ['text'], [[{}]]])(
    'reads no rows from a group that holds %j',
    (group) => {
      const root = form();
      root.controls.group.controls.inner.push(new FormGroup({}));

      service.load(root, config, { group });

      expect(root.controls.group.controls.inner.length).toBe(0);
    },
  );

  it('sizes an array in a row', () => {
    const nested = {
      content: {
        list: {
          type: 'array',
          isFormArray: true,
          rowControl: { type: 'array', isFormArray: true, rowControl },
        },
      },
    } as unknown as NgxFbForm;
    const root = new FormGroup({ list: new FormArray<FormArray>([]) });

    service.load(root, nested, { list: [[{ email: 'a' }, { email: 'b' }]] });

    expect(root.controls.list.at(0).length).toBe(2);
  });

  it('leaves a control alone whose config asks for an array', () => {
    const root = new FormGroup({ list: new FormControl<unknown>(null) });

    service.load(root, config, { list: 1 });

    expect(root.controls.list.value).toBe(1);
  });

  it('leaves a control alone whose config asks for a group', () => {
    const root = new FormGroup({ group: new FormControl<unknown>(null) });

    service.load(root, config, { group: 1 });

    expect(root.controls.group.value).toBe(1);
  });

  it('leaves a group alone whose config is a control', () => {
    const root = new FormGroup({
      field: new FormGroup({ kept: new FormControl('kept') }),
    });

    service.load(root, config, {});

    expect(root.controls.field.value).toEqual({ kept: 'kept' });
  });

  it('leaves an array alone whose config is a group', () => {
    const root = new FormGroup({
      group: new FormArray([new FormControl('kept')]),
    });

    service.load(root, config, {});

    expect(root.controls.group.length).toBe(1);
  });
});
