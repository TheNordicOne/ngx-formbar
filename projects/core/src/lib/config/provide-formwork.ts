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

/**
 * Configures and provides Formwork services to an Angular application
 *
 * Sets up all required services for Formwork based on the provided configuration:
 * - Component registry for dynamic control rendering
 * - Validator registry for form validation rules
 * - Expression service for dynamic form behavior
 *
 * @param config Configuration object with component and validator registrations
 * @returns Angular environment providers that can be used in application bootstrapping
 */
export function provideFormwork<
  S extends RegistrationRecord,
  A extends RegistrationRecord,
>(config: FormworkConfig<S, A>): EnvironmentProviders {
  const {
    componentRegistrations,
    validatorRegistrations,
    asyncValidatorRegistrations,
    updateOn,
    globalConfig,
  } = config;

  return makeEnvironmentProviders([
    {
      provide: ComponentRegistrationService,
      useValue: createComponentRegistrationService(componentRegistrations),
    },
    {
      provide: ValidatorRegistrationService,
      useValue: createValidatorRegistrationService(
        validatorRegistrations,
        asyncValidatorRegistrations,
      ),
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
 * Creates a ComponentRegistrationService with registered form components
 *
 * @param componentRegistrations Array of component registration configurations
 * @returns Configured ComponentRegistrationService instance
 */
function createComponentRegistrationService(
  componentRegistrations: ComponentRegistrationConfig,
) {
  const registrations = toComponentRegistrationMap(componentRegistrations);
  return new ComponentRegistrationService(registrations);
}

/**
 * Converts component registration array to a lookup map
 *
 * @param componentRegistrations Array of component registration configurations
 * @returns Map of component types to component implementations
 */
function toComponentRegistrationMap(
  componentRegistrations: ComponentRegistrationConfig,
) {
  return new Map<string, Type<unknown>>(Object.entries(componentRegistrations));
}

/**
 * Creates a ValidatorRegistrationService with registered validators
 *
 * @param config Configuration object for synchronous validators
 * @param asyncConfig Configuration object for asynchronous validators
 * @returns Configured ValidatorRegistrationService instance
 */
function createValidatorRegistrationService<
  S extends RegistrationRecord,
  A extends RegistrationRecord,
>(config?: ValidatorConfig<S>, asyncConfig?: AsyncValidatorConfig<A>) {
  const registrations = toValidatorRegistrationMap(config, asyncConfig);
  return new ValidatorRegistrationService(...registrations);
}

/**
 * Converts validator configurations to registration maps
 *
 * @param config Configuration object for synchronous validators
 * @param asyncConfig Configuration object for asynchronous validators
 * @returns Tuple of [validatorMap, asyncValidatorMap]
 */
function toValidatorRegistrationMap<
  S extends RegistrationRecord,
  A extends RegistrationRecord,
>(
  config?: ValidatorConfig<S>,
  asyncConfig?: AsyncValidatorConfig<A>,
): [Map<string, ValidatorFn[]>, Map<string, AsyncValidatorFn[]>] {
  if (!config && !asyncConfig) {
    return [
      new Map<string, ValidatorFn[]>(),
      new Map<string, AsyncValidatorFn[]>(),
    ];
  }

  const registrations = toValidatorMap(config);
  const asyncRegistrations = toAsyncValidatorMap(asyncConfig);

  return [registrations, asyncRegistrations];
}

/**
 * Converts validator configuration to a map of validator functions
 * Resolves validator keys to actual validator functions
 *
 * @param config Configuration object for validators
 * @returns Map of validator keys to validator function arrays
 */
function toValidatorMap<S extends RegistrationRecord>(
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
function toAsyncValidatorMap<A extends RegistrationRecord>(
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
