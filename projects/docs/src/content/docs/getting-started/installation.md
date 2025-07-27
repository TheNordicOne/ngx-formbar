---
title: Installation
keyword: InstallationPage
sidebar:
  order: 0
---

:::caution
This project is still in the making and not ready to be used in production!
:::


## Compatibility

At this time this package is only compatible with Angular 19.2.1 or above.

## Primary Installation via Angular Schematic (ng-add)

Running the following command will install ngx-formwork, configure your application providers, and register the core schematics:

```shell
ng add ngx-formwork
```

This schematic by default will set up most helper files as described on the [Improvements & DRY Code Page](/guides/improvements). This will allow for less repetitive code. The other [Schematics](/getting-started/schematics/) will pick up on those helper files. 

:::caution
The schematic will not create a union type! You will have to create this on your own once you got at least one control, group or block. See [Union Types Section on the Improvements & DRY Code Page](/guides/improvements/#union-types) for more details.
:::

### Options

| Option       | Type    | Required | Default                               | Description                                                                                         |
|--------------|---------|----------|---------------------------------------|-----------------------------------------------------------------------------------------------------|
| --project    | string  | No       | workspace default project             | Angular project to add ngx-formwork to.                                                             |
| --helper     | boolean | No       | `true`                                | Include helper files for view providers and host directives.                                        |
| --helperPath | string  | No       | `[projectRoot]/src/app/shared/helper` | Path to place generated helper files if `--helper` is enabled. This path has to be an absolut path. |

### What Changes Are Made

When you run the schematic, it performs the following steps:

1. Adds the `ngx-formwork` dependency to your `package.json` with version `^0.6.0`.
2. Generates base Formwork configuration files (e.g., `formwork.config.ts`) under `src/app`.
3. Updates `angular.json` to register the default control, group, and block schematics.
4. Modifies `app.config.ts` (or `AppModule`) to:
   - Insert imports for `provideFormwork` and `formworkConfig`.
   - Add `provideFormwork(formworkConfig)` to the `appConfig.providers` array.
5. If `--helper` is enabled:
   - Creates helper files (`control-container.view-provider.ts`, `<type>.host-directive.ts`) under the specified `--helperPath`.
   - Updates the schematic defaults in `angular.json` to reference the helper path for `control`, `group`, and `block`.
6. Runs `npm install` to install the added dependencies.

## Manual Installation

For manual setup and configuration, see the [Manual Setup guide](/getting-started/manuel-setup/).
