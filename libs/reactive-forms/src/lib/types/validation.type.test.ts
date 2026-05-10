import {
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Observable, of } from 'rxjs';
import {
  defineAsyncValidatorRegistrations,
  defineFormbarConfig,
  defineValidatorRegistrations,
} from '../config/config';
import {
  toAsyncValidatorRegistrationMap,
  toValidatorRegistrationMap,
} from '../config/provide-formbar';
import {
  NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS,
  NGX_FW_VALIDATOR_REGISTRATIONS,
} from '../tokens/validator-registrations';
import {
  AsyncValidatorConfig,
  RegistrationRecord,
  ValidatorConfig,
} from './validation.type';

interface TestValidators extends RegistrationRecord {
  required: unknown;
  email: unknown;
  minLength: unknown;
  password: unknown;
  combined: unknown;
}

interface TestAsyncValidators extends RegistrationRecord {
  uniqueEmail: unknown;
  serverCheck: unknown;
  combined: unknown;
}

function minLength3(): ValidatorFn {
  return Validators.minLength(3);
}

function letterValidator(
  control: AbstractControl<string | undefined | null>,
): ValidationErrors | null {
  const value = control.value;
  if (!value) {
    return null;
  }
  return /[a-zA-Z]/.test(value) ? null : { letter: true };
}

function uniqueEmailValidator(
  control: AbstractControl<string | undefined | null>,
): Observable<ValidationErrors | null> {
  return of(
    control.value === 'taken@example.com' ? { uniqueEmail: true } : null,
  );
}

function serverCheckValidator(
  control: AbstractControl<string | undefined | null>,
): Observable<ValidationErrors | null> {
  return of(control.value ? null : { serverCheck: true });
}

describe('Type Safety - Validator Definitions', () => {
  it('should type-check direct Angular Validators in a ValidatorConfig', () => {
    const config: ValidatorConfig<TestValidators> = {
      required: [Validators.required],
      email: [Validators.email],
      minLength: [minLength3()],
      password: [Validators.required, minLength3()],
      combined: [Validators.required, Validators.email, letterValidator],
    };
    expect(config).toBeTruthy();
  });

  it('should type-check cross-referencing validators by key', () => {
    const config: ValidatorConfig<TestValidators> = {
      required: [Validators.required],
      email: [Validators.email],
      minLength: [minLength3()],
      password: ['required', 'minLength'],
      combined: ['required', 'email', 'minLength'],
    };
    expect(config).toBeTruthy();
  });

  it('should type-check a mix of validator functions and key references', () => {
    const config: ValidatorConfig<TestValidators> = {
      required: [Validators.required],
      email: [Validators.email],
      minLength: [minLength3()],
      password: [Validators.required, 'minLength', letterValidator],
      combined: ['password', Validators.email],
    };
    expect(config).toBeTruthy();
  });

  it('should type-check an AsyncValidatorConfig with cross-references', () => {
    const config: AsyncValidatorConfig<TestAsyncValidators> = {
      uniqueEmail: [uniqueEmailValidator],
      serverCheck: [serverCheckValidator],
      combined: ['uniqueEmail', 'serverCheck'],
    };
    expect(config).toBeTruthy();
  });
});

describe('Type Safety - defineFormbarConfig usage', () => {
  it('should type-check a full formbar config with validators and cross-references', () => {
    const config = defineFormbarConfig({
      validatorRegistrations: {
        required: [Validators.required],
        email: [Validators.email],
        minLength: [minLength3()],
        password: ['required', 'minLength'],
        combined: ['required', 'email', letterValidator],
      },
      asyncValidatorRegistrations: {
        uniqueEmail: [uniqueEmailValidator],
        serverCheck: [serverCheckValidator],
        combined: ['uniqueEmail', 'serverCheck'],
      },
    });
    expect(config).toBeTruthy();
  });

  it('should type-check a config without async validators', () => {
    const config = defineFormbarConfig({
      validatorRegistrations: {
        required: [Validators.required],
        email: [Validators.email],
        minLength: [minLength3()],
        password: ['required', 'minLength'],
        combined: ['required', 'email'],
      },
    });
    expect(config).toBeTruthy();
  });
});

describe('Type Safety - defineValidatorRegistrations usage', () => {
  it('should type-check a sync validator definition with cross-references', () => {
    const validatorRegistrations = defineValidatorRegistrations({
      required: [Validators.required],
      email: [Validators.email],
      minLength: [minLength3()],
      password: ['required', 'minLength'],
      combined: ['required', 'email', letterValidator],
    });
    expect(validatorRegistrations).toBeTruthy();
  });

  it('should type-check an async validator definition with cross-references', () => {
    const asyncValidatorRegistrations = defineAsyncValidatorRegistrations({
      uniqueEmail: [uniqueEmailValidator],
      serverCheck: [serverCheckValidator],
      combined: ['uniqueEmail', 'serverCheck'],
    });
    expect(asyncValidatorRegistrations).toBeTruthy();
  });

  it('should preserve inferred keys when piped into toValidatorRegistrationMap', () => {
    const map = toValidatorRegistrationMap(
      defineValidatorRegistrations({
        required: [Validators.required],
        email: [Validators.email],
        combined: ['required', 'email'],
      }),
    );

    expect(map.get('combined')).toHaveLength(2);
  });

  it('should preserve inferred keys when piped into toAsyncValidatorRegistrationMap', () => {
    const map = toAsyncValidatorRegistrationMap(
      defineAsyncValidatorRegistrations({
        uniqueEmail: [uniqueEmailValidator],
        combined: ['uniqueEmail'],
      }),
    );

    expect(map.get('combined')).toHaveLength(1);
  });
});

describe('Type Safety - Token-based registration (issue #65)', () => {
  it('should match the ng-add token-based provider shape with cross-references', () => {
    const validatorRegistrationsProvider = {
      provide: NGX_FW_VALIDATOR_REGISTRATIONS,
      useValue: toValidatorRegistrationMap({
        required: [Validators.required],
        email: [Validators.email],
        minLength: [minLength3()],
        password: ['required', 'minLength'],
        combined: ['required', 'email', letterValidator],
      }),
      multi: true,
    };

    expect(validatorRegistrationsProvider.useValue).toBeInstanceOf(Map);
  });

  it('should match the ng-add async token-based provider shape with cross-references', () => {
    const asyncValidatorRegistrationsProvider = {
      provide: NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS,
      useValue: toAsyncValidatorRegistrationMap<TestAsyncValidators>({
        uniqueEmail: [uniqueEmailValidator],
        serverCheck: [serverCheckValidator],
        combined: ['uniqueEmail', 'serverCheck'],
      }),
      multi: true,
    };

    expect(asyncValidatorRegistrationsProvider.useValue).toBeInstanceOf(Map);
  });

  it('should resolve cross-referenced validators at runtime', () => {
    const map = toValidatorRegistrationMap({
      required: [Validators.required],
      email: [Validators.email],
      minLength: [minLength3()],
      password: ['required', 'minLength'],
      combined: ['required', 'email'],
    });

    expect(map.get('required')).toHaveLength(1);
    expect(map.get('password')).toHaveLength(2);
    expect(map.get('combined')).toHaveLength(2);
  });
});
