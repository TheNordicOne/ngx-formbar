import { TestBed } from '@angular/core/testing';
import { Validators } from '@angular/forms';
import {
  NGX_FW_COMPONENT_REGISTRATIONS,
  NGX_FW_CONFIG,
  NGX_FW_DEFAULT_UPDATE_STRATEGY,
} from '@ngx-formbar/core';
import {
  NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS_RESOLVED,
  NGX_FW_VALIDATOR_REGISTRATIONS_RESOLVED,
} from '../tokens/validator-registrations';
import { provideFormbar, toValidatorRegistrationMap } from './provide-formbar';

const first = Validators.required;
const second = Validators.email;
const third = Validators.nullValidator;

function resolved(record: Record<string, unknown[]>) {
  return toValidatorRegistrationMap(record as never);
}

describe('toValidatorRegistrationMap', () => {
  it('keeps plain validators', () => {
    expect(resolved({ a: [first, second] }).get('a')).toEqual([first, second]);
  });

  it('expands a reference', () => {
    expect(resolved({ a: [first, 'b'], b: [second] }).get('a')).toEqual([
      first,
      second,
    ]);
  });

  it('expands a reference that comes later', () => {
    const map = resolved({ a: ['b', 'c'], b: ['c', first], c: [second] });

    expect(map.get('a')).toEqual([second, first, second]);
    expect(map.get('b')).toEqual([second, first]);
    expect(map.get('c')).toEqual([second]);
  });

  it('allows two references to the same key', () => {
    expect(resolved({ a: ['b', 'b'], b: [third] }).get('a')).toEqual([
      third,
      third,
    ]);
  });

  it('reports a cycle with its path', () => {
    expect(() => resolved({ a: ['b'], b: ['c'], c: ['a'] })).toThrow(
      new Error('Cyclic validator reference: b -> c -> a -> b'),
    );
  });

  it('reports a key that references itself', () => {
    expect(() => resolved({ a: ['a'] })).toThrow(
      new Error('Cyclic validator reference: a -> a'),
    );
  });

  it('reports an unknown key', () => {
    expect(() => resolved({ a: ['missing'] })).toThrow(
      new Error('Unknown validator key: "missing"'),
    );
  });

  it('does not take an inherited key for a registration', () => {
    expect(() => resolved({ a: ['toString'] })).toThrow(
      new Error('Unknown validator key: "toString"'),
    );
  });

  it('skips inherited registrations', () => {
    const record = Object.create({ inherited: [first] }) as Record<
      string,
      unknown[]
    >;
    record['own'] = [second];

    expect([...resolved(record).keys()]).toEqual(['own']);
  });
});

describe('provideFormbar', () => {
  function configure(options: Parameters<typeof provideFormbar>[0]) {
    TestBed.configureTestingModule({ providers: [provideFormbar(options)] });
  }

  it('keeps every default without options', () => {
    configure({});

    expect(TestBed.inject(NGX_FW_COMPONENT_REGISTRATIONS)).toEqual(new Map());
    expect(TestBed.inject(NGX_FW_DEFAULT_UPDATE_STRATEGY)).toBe('change');
    expect(TestBed.inject(NGX_FW_CONFIG)).toEqual([]);
    expect(TestBed.inject(NGX_FW_VALIDATOR_REGISTRATIONS_RESOLVED)).toEqual(
      new Map([
        ['required', [Validators.required]],
        ['requiredTrue', [Validators.requiredTrue]],
        ['email', [Validators.email]],
        ['nullValidator', [Validators.nullValidator]],
      ]),
    );
    expect(
      TestBed.inject(NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS_RESOLVED),
    ).toEqual(new Map());
  });

  it('merges registered validators over the defaults', () => {
    configure({
      validatorRegistrations: { email: [first], extra: [second] },
    } as never);

    const map = TestBed.inject(NGX_FW_VALIDATOR_REGISTRATIONS_RESOLVED);

    expect(map.get('email')).toEqual([first]);
    expect(map.get('extra')).toEqual([second]);
    expect(map.get('required')).toEqual([Validators.required]);
  });

  it('registers async validators', () => {
    const asyncValidator = () => Promise.resolve(null);
    configure({
      asyncValidatorRegistrations: { unique: [asyncValidator] },
    } as never);

    expect(
      TestBed.inject(NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS_RESOLVED).get(
        'unique',
      ),
    ).toEqual([asyncValidator]);
  });

  it('sets the update strategy', () => {
    configure({ updateOn: 'blur' } as never);

    expect(TestBed.inject(NGX_FW_DEFAULT_UPDATE_STRATEGY)).toBe('blur');
  });
});
