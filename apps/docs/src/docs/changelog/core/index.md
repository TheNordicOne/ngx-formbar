## v2.0.0

### Overview

The core package has been narrowed to focus on content rendering, expression evaluation, and DI infrastructure. All reactive forms code has been moved to `@ngx-formbar/reactive-forms`.

If you want, you can also use the core package on its own to build your own implementations, or use it as a utility library.

### Added

- Composable functions for expression and state resolution: `resolveExpression`, `resolveInheritableExpression`, `resolveHiddenState`, `resolveTestId`, `resolveHiddenAttribute`, `resolveUpdateStrategy`
- Form-agnostic composables for component registration lookup, dynamic mounting, and value inheritance: `withBase`, `withComponentHost` (with `ComponentHost` and `ComponentHostOptions` types), `withInheritedValue`, `withLoadedComponent`. These have no dependency on `@angular/forms` and are available to any consumer that builds on top of `@ngx-formbar/core`
- `FormConfigEntry<T>` content-binding type (`{ name: string; config: T }`) used by directive inputs and outlets that render a single named entry from a configuration tree
- `toSignalMap` helper and `SignalMapFor<T>` type for building the typed `Map<string, Signal<unknown>>` consumed by `withComponentHost`. Anchoring the record to a directive interface forces every key and signal type to match the contract, so stray keys, typos, and stale entries fail to compile
- Form-state composables that wrap the existing `resolve*` functions and read from new DI tokens: `withDynamicLabel`, `withDynamicTitle`, `withComputedValue`, `withHiddenState`, `withDisabledState`, `withReadonlyState`, `withTestId`, `withUpdateStrategy`. Each runs in any injection context that has the required tokens provided
- `NGX_FW_FORM_VALUE` token (`Signal<FormContext>`): per-form provider for the current form value, consumed by composables that evaluate expressions. Integrations supply this from their form-state source
- `NGX_FW_PARENT_CONTEXT` token and `NgxFwParentContext` interface: contract for a parent group's state and inheritable directive options (`isHidden`, `isDisabled`, `isReadonly`, `testId`, `hideStrategy`, `valueStrategy`, `updateStrategy`). Group directives provide themselves; child composables read with `{ optional: true, skipSelf: true }`
- Type guards for narrowing content entries: `isFormbarControl`, `isFormbarGroup`, `isFormbarBlock`. Each accepts either a value or a `Signal` and narrows to the corresponding `NgxFbControl` / `NgxFbFormGroup` / `NgxFbBlock` shape
- Utility types for building consumer-facing component contracts on top of Angular signal inputs: `SignalInput<T>`, `ToSignalInputs<T>`, `RemoveIndexSignature<T>`, `BlockManagedKeys`, `ExtendedBlockInputs<T>`. Used by `@ngx-formbar/reactive-forms` to derive the public input surface for blocks
- New `disabledHandling?: StateHandling` option on component registrations, mirroring the existing visibility option. When set to `'manual'`, the library leaves the underlying form control's disabled state alone and the component receives the resolved `isDisabled` signal to apply itself. Defaults to `'auto'`
- String helper utilities via `toSafeString`

### Changed

- Peer dependencies are now limited to `@angular/core` (`>=20.0.0 <22.0.0`). `@angular/forms` and `@angular/cdk` are no longer required by the core package
- Composable functions and low-level services are now part of the public API for consumers building custom form implementations
- Component registrations now use `ComponentRegistrationEntry` instead of bare `Type<unknown>`. Each entry is either a static registration (`{ component: Type<unknown> }`) or a lazy registration (`{ loadComponent: LoadComponentFn }`), optionally with a `ComponentRegistrationOptions`. Helper functions `staticComponent()` and `loadComponent()` accept an optional second argument for these options. The `NGX_FW_COMPONENT_REGISTRATIONS` token and `ComponentResolver` interface use `ComponentRegistrationEntry` accordingly
- Registration option renamed: `visibilityHandling` is now `hiddenHandling` (still typed as `StateHandling = 'auto' | 'manual'`, default `'auto'`). Update any registrations that previously passed `{ visibilityHandling: 'manual' }` to `{ hiddenHandling: 'manual' }`
- Type renamed: `NgxFbContent` is now `NgxFbItem`. The shape is unchanged (`NgxFbFormGroup | NgxFbControl | NgxFbBlock`). Update any imports or type annotations that referenced `NgxFbContent`

### Removed

- `NgxfbFormComponent`, `NgxfbControlDirective`, `NgxfbGroupDirective`, `NgxfbBlockDirective` (moved to `@ngx-formbar/reactive-forms`)
- `provideFormbar` and `defineFormbarConfig` (moved to `@ngx-formbar/reactive-forms`)
- `ValidatorConfig`, `AsyncValidatorConfig`, `RegistrationRecord` types (moved to `@ngx-formbar/reactive-forms`)
- `NGX_FW_VALIDATOR_REGISTRATIONS`, `NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS`, `NGX_VALIDATOR_RESOLVER` tokens (moved to `@ngx-formbar/reactive-forms`)
- `ValidatorRegistrationService` (moved to `@ngx-formbar/reactive-forms`)
- All schematics (moved to `@ngx-formbar/schematics`)

### Expression engine

The expression language used by `Expression<T>` strings has been hardened and made consistent. Parsing is now done by an in-tree allow-list parser adapted from [jsep](https://github.com/EricSmekens/jsep) (MIT). The runtime `acorn` dependency has been removed; `@ngx-formbar/core` has zero parsing dependencies, transitively or otherwise. The grammar is restricted to a small, well-defined surface and several JavaScript divergences are intentional.

#### Added

- Object literal spread (`({...a, b: 1})`). Previously the spread was silently dropped at evaluation.
- Spread in call arguments (`s.concat(...rest)`). The array is flattened into positional args.
- Bounded LRU cache on parsed ASTs (cap 256). Replaces the previous unbounded `Map`.
- Generic type parameter on `ExpressionService.evaluateExpression`. The signature is now `evaluateExpression<T = unknown>(ast, context): T | null`. Callers can write `service.evaluateExpression<boolean>(ast, ctx)` instead of casting the result.

#### Changed

- `==` and `!=` are now strict. They behave identically to `===` and `!==`. Loose-equality coercion (`0 == ""`, `null == undefined`, `"1" == 1`) returns `false` in the new semantics.
- Division and modulo by zero throw instead of returning `Infinity` or `NaN`.
- Identifier lookup uses own-property semantics. Members inherited from `Object.prototype` (`constructor`, `toString`, `hasOwnProperty`, etc.) no longer resolve from a bare identifier.
- The `in` operator uses hasOwn semantics. `'toString' in obj` returns `false` instead of walking the prototype chain.
- Member access on plain objects uses hasOwn. Inherited members return `undefined`.
- Member access on arrays is restricted to `.length` and canonical non-negative integer indices (`arr[0]`, `arr["0"]`). Reading prototype methods as values (`arr.push`, `arr.map` without calling) throws.
- Member access on strings is restricted to `.length` and canonical integer indices. Raw method extraction (`"x".toUpperCase` as a value) throws. Calls via the call form (`"x".toUpperCase()`) still work.
- Member access on function-typed values throws.
- Method calls are gated by a per-type allow-list of non-mutating methods. Array mutators (`sort`, `push`, `pop`, `shift`, `unshift`, `splice`, `reverse`, `fill`, `copyWithin`) throw. Plain objects, `Date`, `Map`, `Set`, and `RegExp` instances have no callable methods.
- Object literal `__proto__` keys (literal, computed, or via spread) no longer reset the prototype of the returned object.
- `LICENSE` and `LICENSE-jsep` are now included in the published bundle.

#### Removed

- Runtime dependency on `acorn`. Consumers no longer pull acorn transitively.
- Multi-statement input. `1; 2`, `"a"\n"b"`, and similar throw at parse time.
- Top-level comma sequences. `(a, b)` and `1, 2, 3` are parse errors. The form `(a, b) => ...` still parses as a multi-param arrow.
- The `this` keyword. Bare `this` and any access through it are parse errors.
- The `delete` operator.
- Multi-expression template placeholders. `` `${a; b}` `` and `` `${a, b}` `` are parse errors.
- Rest parameters in arrow functions. `(...x) => x` is a parse error.

### Migration

See [**Migrating from v1**](/changelog/migrating-from-v1) for the full step-by-step guide, including [Step 10](/changelog/migrating-from-v1#step-10-audit-string-based-expressions) which lists the expression-language behavior changes that may affect existing schemas.
