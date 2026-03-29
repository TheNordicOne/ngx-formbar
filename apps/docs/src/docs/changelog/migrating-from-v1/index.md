## Overview

Version 2 splits `@ngx-formbar/core` into multiple focused packages. The core library no longer depends on `@angular/forms` — all reactive forms functionality now lives in `@ngx-formbar/reactive-forms`.

**New package structure:**

| Package                       | Purpose                                                                                 |
|-------------------------------|-----------------------------------------------------------------------------------------|
| `@ngx-formbar/core`           | Core types, expression engine, DI tokens, and services (no `@angular/forms` dependency) |
| `@ngx-formbar/reactive-forms` | Directives, form component, provider setup, and reactive forms code                     |
| `@ngx-formbar/schematics`     | Code generators for controls, groups, and blocks                                        |
| `@ngx-formbar/setup`          | Shared AST and file utilities used by schematics                                        |

## Prerequisites

- Angular 19.2.0 or higher

## Step 1: Update dependencies

Install the new packages alongside `@ngx-formbar/core`.

```shell
npm install @ngx-formbar/reactive-forms
npm install -D @ngx-formbar/schematics
```

> **Note**
> `@ngx-formbar/schematics` is only required if you want to use the schematics.

## Step 2: Update component and directive imports

The form component and directives moved from `@ngx-formbar/core` to `@ngx-formbar/reactive-forms`.

**Before:**

```typescript
import {
  NgxfbFormComponent,
  NgxfbControlDirective,
  NgxfbGroupDirective,
  NgxfbBlockDirective,
} from '@ngx-formbar/core';
```

**After:**

```typescript
import {
  NgxfbFormComponent,
  NgxfbControlDirective,
  NgxfbGroupDirective,
  NgxfbBlockDirective,
} from '@ngx-formbar/reactive-forms';
```

## Step 3: Update provideFormbar import

The `provideFormbar` function moved to the reactive-forms package. Its signature and usage are unchanged.

**Before:**

```typescript
import { provideFormbar } from '@ngx-formbar/core';
```

**After:**

```typescript
import { provideFormbar } from '@ngx-formbar/reactive-forms';
```

## Step 4: Update defineFormbarConfig import

If you use the `defineFormbarConfig` type helper, update its import path.

**Before:**

```typescript
import { defineFormbarConfig } from '@ngx-formbar/core';
```

**After:**

```typescript
import { defineFormbarConfig } from '@ngx-formbar/reactive-forms';
```

## Step 5: Update validator-related imports

Validator types and tokens moved to `@ngx-formbar/reactive-forms`.

**Before:**

```typescript
import {
  ValidatorConfig,
  AsyncValidatorConfig,
  RegistrationRecord,
  NGX_FW_VALIDATOR_REGISTRATIONS,
  NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS,
  NGX_VALIDATOR_RESOLVER,
} from '@ngx-formbar/core';
```

**After:**

```typescript
import {
  ValidatorConfig,
  AsyncValidatorConfig,
  RegistrationRecord,
  NGX_FW_VALIDATOR_REGISTRATIONS,
  NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS,
  NGX_VALIDATOR_RESOLVER,
} from '@ngx-formbar/reactive-forms';
```

## Step 6: Update schematics commands

The `ng add` command now targets the reactive-forms package, and code generators live in `@ngx-formbar/schematics`.

**Installation (ng-add):**

```shell
# Before
ng add @ngx-formbar/core

# After
ng add @ngx-formbar/reactive-forms
```

**Code generators:**

```shell
# Before (generators were part of @ngx-formbar/core)
ng generate @ngx-formbar/core:control
ng generate @ngx-formbar/core:group
ng generate @ngx-formbar/core:block

# After (generators are in @ngx-formbar/schematics)
ng generate @ngx-formbar/schematics:control
ng generate @ngx-formbar/schematics:group
ng generate @ngx-formbar/schematics:block
```

If you have scripts or CI commands that reference the old schematic package name, update those as well.

## What stays in @ngx-formbar/core

The following imports remain in `@ngx-formbar/core` and do **not** need to change:

**Types:**

- `Expression`, `FormContext`
- `NgxFbForm`, `NgxFbContent`, `NgxFbBaseContent`
- `NgxFbControl`, `NgxFbFormGroup`, `NgxFbBlock`
- `ComponentResolver`, `ComponentRegistrationConfig`
- `NgxFbGlobalConfiguration`
- `UpdateStrategy`

**DI Tokens:**

- `NGX_FW_COMPONENT_REGISTRATIONS`
- `NGX_FW_COMPONENT_RESOLVER`
- `NGX_FW_DEFAULT_UPDATE_STRATEGY`
- `NGX_FW_CONFIG`

**Services:**

- `ExpressionService`
- `ComponentRegistrationService`
- `NgxFbConfigurationService`

If your code only imports types and tokens from `@ngx-formbar/core`, those imports remain valid.

## Quick reference

| Export                                 | v1 (`@ngx-formbar/core`) | v2                              |
|----------------------------------------|--------------------------|---------------------------------|
| `NgxfbFormComponent`                   | `@ngx-formbar/core`      | `@ngx-formbar/reactive-forms`   |
| `NgxfbControlDirective`                | `@ngx-formbar/core`      | `@ngx-formbar/reactive-forms`   |
| `NgxfbGroupDirective`                  | `@ngx-formbar/core`      | `@ngx-formbar/reactive-forms`   |
| `NgxfbBlockDirective`                  | `@ngx-formbar/core`      | `@ngx-formbar/reactive-forms`   |
| `provideFormbar`                       | `@ngx-formbar/core`      | `@ngx-formbar/reactive-forms`   |
| `defineFormbarConfig`                  | `@ngx-formbar/core`      | `@ngx-formbar/reactive-forms`   |
| `FormbarConfig`                        | `@ngx-formbar/core`      | `@ngx-formbar/reactive-forms`   |
| `ValidatorConfig`                      | `@ngx-formbar/core`      | `@ngx-formbar/reactive-forms`   |
| `AsyncValidatorConfig`                 | `@ngx-formbar/core`      | `@ngx-formbar/reactive-forms`   |
| `NGX_FW_VALIDATOR_REGISTRATIONS`       | `@ngx-formbar/core`      | `@ngx-formbar/reactive-forms`   |
| `NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS` | `@ngx-formbar/core`      | `@ngx-formbar/reactive-forms`   |
| `NGX_VALIDATOR_RESOLVER`               | `@ngx-formbar/core`      | `@ngx-formbar/reactive-forms`   |
| `Expression`, `NgxFbForm`, etc.        | `@ngx-formbar/core`      | `@ngx-formbar/core` (unchanged) |
| `ExpressionService`                    | `@ngx-formbar/core`      | `@ngx-formbar/core` (unchanged) |
| Code generators                        | `@ngx-formbar/core`      | `@ngx-formbar/schematics`       |
| `ng add`                               | `@ngx-formbar/core`      | `@ngx-formbar/reactive-forms`   |
