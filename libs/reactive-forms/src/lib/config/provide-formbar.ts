import {
  EnvironmentProviders,
  makeEnvironmentProviders,
  Provider,
} from '@angular/core';
import {
  ComponentRegistrationConfig,
  ComponentRegistrationEntry,
  ComponentRegistrationService,
  ExpressionService,
  NGX_FW_COMPONENT_REGISTRATIONS,
  NGX_FW_COMPONENT_RESOLVER,
  NGX_FW_CONFIG,
  NGX_FW_DEFAULT_UPDATE_STRATEGY,
} from '@ngx-formbar/core';
import { AsyncValidatorFn, ValidatorFn } from '@angular/forms';
import {
  AsyncValidatorConfig,
  RegistrationRecord,
  ValidatorConfig,
  ValidatorKey,
} from '../types/validation.type';
import { ValidatorRegistrationService } from '../services/validator-registration.service';
import {
  NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS,
  NGX_FW_VALIDATOR_REGISTRATIONS,
} from '../tokens/validator-registrations';
import { NGX_VALIDATOR_RESOLVER } from '../tokens/validator-resolver';
import { FormbarConfig } from '../types/provide.type';

/**
 * Provides ngx-formbar to an Angular application. Use in `app.config.ts` to
 * register components, validators, and global configuration. Angular's
 * `required`, `requiredTrue`, `email`, and `nullValidator` are registered by
 * default.
 *
 * @param config Optional {@link FormbarConfig}. Each field is independent:
 *   - `componentRegistrations`: maps control `type` strings to component
 *     registration entries (static or lazy).
 *   - `validatorRegistrations`: registers sync validator keys; merged with
 *     the built-in defaults so user keys can shadow them.
 *   - `asyncValidatorRegistrations`: registers async validator keys.
 *   - `updateOn`: default `UpdateStrategy` applied to every control unless
 *     the control or its parent group sets its own.
 *   - `globalConfig`: arbitrary global configuration consumed via
 *     `NGX_FW_CONFIG` (multi).
 * @returns Angular `EnvironmentProviders` to include in the application
 *   provider list.
 *
 * @example
 * ```ts
 * // app.config.ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideFormbar({
 *       componentRegistrations: {
 *         text: staticComponent(TextInputComponent),
 *         select: loadComponent(() => import('./select.component').then(m => m.SelectComponent)),
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

function toComponentRegistrationMap(
  componentRegistrations: ComponentRegistrationConfig,
) {
  return new Map<string, ComponentRegistrationEntry>(
    Object.entries(componentRegistrations),
  );
}

export function toValidatorRegistrationMap<S extends RegistrationRecord>(
  config: ValidatorConfig<S>,
): ReadonlyMap<string, ValidatorFn[]> {
  return toValidatorMap<S, ValidatorFn>(config);
}

export function toAsyncValidatorRegistrationMap<A extends RegistrationRecord>(
  config: AsyncValidatorConfig<A>,
): ReadonlyMap<string, AsyncValidatorFn[]> {
  return toValidatorMap<A, AsyncValidatorFn>(config);
}

/**
 * Flattens an array of validator functions and string keys into validator
 * functions. Resolves keys via `registrations`, follows nested references
 * recursively, memoizes results, and throws on cyclic references or unknown
 * keys.
 *
 * @param validators Mixed array of validator functions and registration keys
 *   to flatten.
 * @param registrations Source map of all registered validators, keyed by
 *   validator name.
 * @param memo Memoization cache shared across recursive calls so repeated
 *   keys resolve only once.
 * @param visiting Set of keys on the active resolution path. Used to detect
 *   cycles; throws when a key is revisited before its resolution completes.
 * @returns A flattened array of validator functions of type `V`.
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
) {
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
