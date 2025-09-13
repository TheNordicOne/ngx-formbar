import {
  EnvironmentProviders,
  makeEnvironmentProviders,
  Type,
} from '@angular/core';
import { ComponentRegistrationService } from '../services/component-registration.service';
import { FormworkConfig } from '../types/provide.type';
import { ComponentRegistrationConfig } from '../types/registration.type';
import { AsyncValidatorFn, ValidatorFn, Validators } from '@angular/forms';
import {
  AsyncValidatorConfig,
  RegistrationRecord,
  ValidatorConfig,
  ValidatorKey,
} from '../types/validation.type';
import { ValidatorRegistrationService } from '../services/validator-registration.service';
import { ExpressionService } from '../services/expression.service';
import { DefaultUpdateStrategy } from '../tokens/default-update-strategy';
import { NgxFwConfigurationService } from '../services/configuration.service';
import { NgxFwComponentRegistrations } from '../tokens/component-registrations';
import {
  NgxFwAsyncValidatorRegistrations,
  NgxFwValidatorRegistrations,
} from '../tokens/validator-registrations';
import { NgxFwValidatorResolver } from '../tokens/validator-resolver';
import { NgxFwComponentResolver } from '../tokens/component-resolver';

/**
 * Configures and provides ngx-formwork to your application.
 *
 * This function is used in app.config.ts to register form components, validators,
 * and set global configuration for the formwork library.
 *
 * @param config Configuration object for ngx-formwork:
 *   - componentRegistrations: Optional mapping of control types to component implementations
 *   - validatorRegistrations: Optional mapping of validator names to validator functions
 *     (Angular's required, requiredTrue, email, and nullValidator are registered by default)
 *   - asyncValidatorRegistrations: Optional mapping of async validator names to async validator functions
 *   - updateOn: Optional default update strategy for all form controls
 *   - globalConfig: Optional global configuration settings
 *
 * @returns Angular environment providers to be included in application configuration
 *
 * @example
 * ```ts
 * // app.config.ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideFormwork({
 *       componentRegistrations: {
 *         text: TextInputComponent,
 *         select: SelectComponent,
 *       },
 *       validatorRegistrations: {
 *         customValidator: [myCustomValidator]
 *       }
 *     })
 *   ]
 * };
 * ```
 */
export function provideFormwork<
  S extends RegistrationRecord,
  A extends RegistrationRecord,
>(config?: FormworkConfig<S, A>): EnvironmentProviders {
  config ??= {};
  const {
    componentRegistrations,
    validatorRegistrations,
    asyncValidatorRegistrations,
    updateOn,
    globalConfig,
  } = config;

  return makeEnvironmentProviders([
    {
      provide: NgxFwComponentRegistrations,
      useValue: toComponentRegistrationMap(componentRegistrations),
    },
    {
      provide: NgxFwValidatorRegistrations,
      useValue: toValidatorRegistrationMap(validatorRegistrations),
    },
    {
      provide: NgxFwAsyncValidatorRegistrations,
      useValue: toAsyncValidatorRegistrationMap(asyncValidatorRegistrations),
    },
    {
      provide: NgxFwComponentResolver,
      useClass: ComponentRegistrationService,
    },
    {
      provide: NgxFwValidatorResolver,
      useClass: ValidatorRegistrationService,
    },
    {
      provide: DefaultUpdateStrategy,
      useValue: updateOn,
    },
    {
      provide: NgxFwConfigurationService,
      useFactory: () => {
        const service = new NgxFwConfigurationService();
        service.configure(globalConfig);
        return service;
      },
    },
    ExpressionService,
  ]);
}

/**
 * Converts component registration array to a lookup map
 *
 * @param componentRegistrations Array of component registration configurations
 * @returns Map of component types to component implementations
 */
function toComponentRegistrationMap(
  componentRegistrations?: ComponentRegistrationConfig,
) {
  if (!componentRegistrations) {
    return new Map<string, Type<unknown>>();
  }
  return new Map<string, Type<unknown>>(Object.entries(componentRegistrations));
}

/**
 * Converts validator configuration to a map of validator functions
 * Resolves validator keys to actual validator functions
 *
 * @param config Configuration object for validators
 * @returns Map of validator keys to validator function arrays
 */
function toValidatorRegistrationMap<S extends RegistrationRecord>(
  config?: ValidatorConfig<S>,
) {
  if (!config) {
    return new Map<string, ValidatorFn[]>();
  }
  const rawRegistrations = new Map<string, (ValidatorFn | ValidatorKey<S>)[]>(
    Object.entries(config),
  );
  const registrations = getDefaultRegistrations();
  const memo = new Map<string, ValidatorFn[]>();

  for (const [key, validators] of rawRegistrations) {
    registrations.set(key, toValidatorFn(validators, rawRegistrations, memo));
  }
  return registrations;
}

/**
 * Resolves validator references to actual validator functions
 * Supports recursive validator references and memoization
 *
 * @param validators Array of validator functions or validator keys
 * @param registrations Map of all registered validators
 * @param memo Memoization cache to avoid circular references
 * @returns Flattened array of validator functions
 */
function toValidatorFn<T extends RegistrationRecord, V>(
  validators: (V | ValidatorKey<T>)[],
  registrations: Map<string, (V | ValidatorKey<T>)[]>,
  memo = new Map<string, V[]>(),
): V[] {
  return validators.flatMap((v) => {
    switch (typeof v) {
      case 'string': {
        const memoedValue = memo.get(v);
        if (memoedValue) {
          return memoedValue;
        }
        const resolved = toValidatorFn(
          registrations.get(v) ?? [],
          registrations,
          memo,
        );
        memo.set(v, resolved);
        return resolved;
      }
      default:
        return v;
    }
  });
}

/**
 * Converts async validator configuration to a map of async validator functions
 *
 * @param config Configuration object for async validators
 * @returns Map of validator keys to async validator function arrays
 */
function toAsyncValidatorRegistrationMap<A extends RegistrationRecord>(
  config?: AsyncValidatorConfig<A>,
) {
  if (!config) {
    return new Map<string, AsyncValidatorFn[]>();
  }

  const rawRegistrations = new Map<
    string,
    (AsyncValidatorFn | ValidatorKey<A>)[]
  >(Object.entries(config));
  const registrations = new Map<string, AsyncValidatorFn[]>();
  const memo = new Map<string, AsyncValidatorFn[]>();

  for (const [key, validators] of rawRegistrations) {
    registrations.set(key, toValidatorFn(validators, rawRegistrations, memo));
  }
  return registrations;
}

/**
 * Returns a map of default Angular validators
 * Provides built-in validators like required, email, etc.
 *
 * @returns Map of validator keys to validator function arrays
 */
function getDefaultRegistrations() {
  return new Map<string, ValidatorFn[]>([
    ['required', [Validators.required]],
    ['requiredTrue', [Validators.requiredTrue]],
    ['email', [Validators.email]],
    ['nullValidator', [Validators.nullValidator]],
  ]);
}
