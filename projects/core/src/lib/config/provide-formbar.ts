import {
  EnvironmentProviders,
  makeEnvironmentProviders,
  Provider,
  Type,
} from '@angular/core';
import { ComponentRegistrationService } from '../services/component-registration.service';
import { ComponentRegistrationConfig } from '../types/registration.type';
import { AsyncValidatorFn, ValidatorFn } from '@angular/forms';
import {
  AsyncValidatorConfig,
  RegistrationRecord,
  ValidatorConfig,
  ValidatorKey,
} from '../types/validation.type';
import { ValidatorRegistrationService } from '../services/validator-registration.service';
import { ExpressionService } from '../services/expression.service';
import { NGX_FW_DEFAULT_UPDATE_STRATEGY } from '../tokens/default-update-strategy';
import { NGX_FW_COMPONENT_REGISTRATIONS } from '../tokens/component-registrations';
import {
  NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS,
  NGX_FW_VALIDATOR_REGISTRATIONS,
} from '../tokens/validator-registrations';
import { NGX_VALIDATOR_RESOLVER } from '../tokens/validator-resolver';
import { NGX_FW_COMPONENT_RESOLVER } from '../tokens/component-resolver';
import { NGX_FW_CONFIG } from '../tokens/global-config';
import { FormbarConfig } from '../types/provide.type';

/**
 * Configures and provides ngx-formbar to your application.
 *
 * This function is used in app.config.ts to register form components, validators,
 * and set global configuration for the formbar library.
 *
 * @param config Configuration object for ngx-formbar:
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
 *     provideFormbar({
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
export function provideFormbar<
  S extends RegistrationRecord,
  A extends RegistrationRecord,
>(config?: FormbarConfig<S, A>): EnvironmentProviders {
  config ??= {};
  const {
    componentRegistrations,
    validatorRegistrations,
    asyncValidatorRegistrations,
    updateOn,
    globalConfig,
  } = config;

  const providers: (Provider | EnvironmentProviders)[] = [
    {
      provide: NGX_FW_COMPONENT_RESOLVER,
      useClass: ComponentRegistrationService,
    },
    {
      provide: NGX_VALIDATOR_RESOLVER,
      useClass: ValidatorRegistrationService,
    },
    ExpressionService,
  ];

  if (componentRegistrations !== undefined) {
    providers.push({
      provide: NGX_FW_COMPONENT_REGISTRATIONS,
      useValue: toComponentRegistrationMap(componentRegistrations),
    });
  }

  if (validatorRegistrations !== undefined) {
    providers.push({
      provide: NGX_FW_VALIDATOR_REGISTRATIONS,
      useFactory: () => toValidatorRegistrationMap(validatorRegistrations),
      multi: true,
    });
  }

  if (asyncValidatorRegistrations !== undefined) {
    providers.push({
      provide: NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS,
      useFactory: () =>
        toAsyncValidatorRegistrationMap(asyncValidatorRegistrations),
      multi: true,
    });
  }

  if (updateOn !== undefined) {
    providers.push({
      provide: NGX_FW_DEFAULT_UPDATE_STRATEGY,
      useValue: updateOn,
    });
  }

  if (globalConfig !== undefined) {
    providers.push({
      provide: NGX_FW_CONFIG,
      useValue: globalConfig,
      multi: true,
    });
  }

  return makeEnvironmentProviders(providers);
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
 * Converts validator configuration to a map of validator functions
 * Resolves validator keys to actual validator functions
 *
 * @param config Configuration object for validators
 * @returns Map of validator keys to validator function arrays
 */
function toValidatorRegistrationMap<S extends RegistrationRecord>(
  config: ValidatorConfig<S>,
): ReadonlyMap<string, ValidatorFn[]> {
  return toValidatorMap<S, ValidatorFn>(config);
}

/**
 * Converts async validator configuration to a map of async validator functions
 *
 * @param config Configuration object for async validators
 * @returns Map of validator keys to async validator function arrays
 */
function toAsyncValidatorRegistrationMap<A extends RegistrationRecord>(
  config: AsyncValidatorConfig<A>,
): ReadonlyMap<string, AsyncValidatorFn[]> {
  return toValidatorMap<A, AsyncValidatorFn>(config);
}

/**
 * Resolves validator references to actual validator functions
 * Supports recursive validator references and memoization
 *
 * @param validators Array of validator functions or validator keys
 * @param registrations Map of all registered validators
 * @param memo Memoization cache to avoid circular references
 * @param visiting
 * @returns Flattened array of validator functions
 */
function toValidatorFn<T extends RegistrationRecord, V>(
  validators: (V | ValidatorKey<T>)[],
  registrations: Record<string, (V | ValidatorKey<T>)[]>,
  memo = new Map<string, V[]>(),
  visiting = new Set<string>(),
): V[] {
  return validators.flatMap((v) => {
    switch (typeof v) {
      case 'string': {
        const cached = memo.get(v);
        if (cached) return cached;

        if (visiting.has(v))
          throw new Error(
            `Cyclic validator reference: ${[...visiting, v].join(' -> ')}`,
          );

        if (!Object.prototype.hasOwnProperty.call(registrations, v))
          throw new Error(`Unknown validator key: "${v}"`);
        const spec = registrations[v];

        visiting.add(v);
        const resolved = toValidatorFn(spec, registrations, memo, visiting);
        visiting.delete(v);
        memo.set(v, resolved);
        return resolved;
      }
      default:
        return v;
    }
  });
}

function toValidatorMap<T extends RegistrationRecord, V>(
  source: Record<string, (V | ValidatorKey<T>)[]>,
): ReadonlyMap<string, V[]> {
  const out = new Map<string, V[]>();
  const memo = new Map<string, V[]>();

  for (const key in source) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) {
      continue;
    }

    const spec = source[key];
    const cached = memo.get(key);
    if (cached) {
      out.set(key, cached);
      continue;
    }
    const resolved = toValidatorFn(spec, source, memo);
    memo.set(key, resolved);
    out.set(key, resolved);
  }
  return out;
}
