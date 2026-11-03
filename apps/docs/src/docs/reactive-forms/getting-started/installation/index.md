## Compatibility

This package is compatible with Angular 20.0.0 up to (but not including) Angular 23.

## Primary Installation via ng-add

This command installs _ngx-formbar_.

```shell
ng add @ngx-formbar/reactive-forms
```

By default, this does the following.

- Install `@ngx-formbar/reactive-forms` and `@ngx-formbar/core` as dependencies, in matching versions
- Install `@ngx-formbar/schematics` as a dev dependency (for the control, group, block, array, register, and schema generators)
- Create a provider configuration file
- Setup token-based registration including
  - barrel export
  - component registration
  - validator registration
  - async validator registration
- Setup helper files including
  - barrel export
  - control container view provider
- Create a schematics configuration file
- Create a content union file (`content.type.ts` with an `AppContent` type) that the schematics configuration file points at
- Provide _ngx-formbar_ in your application's [root providers](#root-providers)
- Install dependencies

> **Note**
> The schematics configuration file only contains values that differ from the defaults.

> **Note**
> `ng add` never overwrites a file that already exists. Running it again keeps your registrations, helper files, schematics configuration file and content union as they are. When the options of that run differ from a kept schematics configuration file, `ng add` logs a warning naming each ignored setting. When that file is the shared one at the workspace root, the project gets its own file in the `app` folder of its source root instead.

> **Note**
> With `--registrationStyle=config --provideInline --splitRegistrations=false`, registrations go in the root providers only for `bootstrapApplication(App, appConfig)`. With any other bootstrap call they go in `--registrationsPath`, where the generators can add to them.

> **Note**
> A schematics configuration file wins over the `angular.json` settings written with `--useSchematicConfig=false`. `ng add` logs a warning naming the file when there is one.

> **Note**
> `helperPath` is a folder. To rename the files or exports later, see [Notes for the View Provider Path Option](/fundamentals/generators#notes-for-the-view-provider-path-option).

## Root Providers

`ng add` follows the bootstrap call in the project's main file, also into files that file imports, and edits:

| The bootstrap call                                  | `ng add` edits                                                                                                 |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `bootstrapApplication(App, appConfig)`              | The `appConfig` variable, also through a barrel or a path alias                                                |
| `bootstrapApplication(App, { providers: [] })`      | The object                                                                                                     |
| `bootstrapApplication(App)`                         | The call, which gets a config object                                                                           |
| `bootstrapApplication(App, makeConfig())`           | The call, as `bootstrapApplication(App, mergeApplicationConfig(makeConfig(), { providers: [...] }))`           |
| `bootstrapApplication(App, { ...base })`            | The call, wrapped the same way                                                                                 |
| `bootstrapApplication(App, configFromOtherProject)` | The call, wrapped the same way, so that no other project imports from this one                                 |
| `platformBrowser().bootstrapModule(AppModule)`      | The `providers` of `AppModule`, also through a barrel or a path alias                                          |
| None                                                | `app/app.config.ts` in the source root, with a warning naming it. If that file is missing too, `ng add` fails. |

A root NgModule has to be a named class declared in the project, and its metadata has to be an object in the decorator, with no spread or with a `providers` array after it. Otherwise `ng add` fails naming the file.

## Options

| Option                    | Type                | Required | Default                         | Description                                                                                                                                                                                                                       |
| ------------------------- | ------------------- | -------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| --project                 | string              | No       | workspace default project       | Angular project to add _ngx-formbar_ to.                                                                                                                                                                                          |
| --registrationStyle       | `token` \| `config` | No       | `token`                         | The registration style to be used.                                                                                                                                                                                                |
| --provideInline           | boolean             | No       | `false`                         | Configure `provideFormbar` in the root providers, without a provider configuration file.                                                                                                                                          |
| --providerConfigPath      | string              | No       | `app`                           | Folder for the provider configuration file. See [Paths](#paths).                                                                                                                                                                  |
| --providerConfigFileName  | string              | No       | `formbar.config.ts`             | Name of the provider configuration file.                                                                                                                                                                                          |
| --includeSyncValidators   | boolean             | No       | `true`                          | Whether to include the setup for validators.                                                                                                                                                                                      |
| --includeAsyncValidators  | boolean             | No       | `true`                          | Whether to include the setup for async validators.                                                                                                                                                                                |
| --useHelper               | boolean             | No       | `true`                          | Include helper files for the view provider used by control and group components.                                                                                                                                                  |
| --helperPath              | string              | No       | `app/shared/helper`             | Folder for the helper files. See [Paths](#paths).                                                                                                                                                                                 |
| --splitRegistrations      | boolean             | No       | `true`                          | Put the registrations in their own files in `--registrationsPath`. If `false`, token style puts them in the root providers, and config style in the provider configuration file, or in the root providers with `--provideInline`. |
| --registrationsPath       | string              | No       | `app/registrations`             | Folder for the registration files. See [Paths](#paths).                                                                                                                                                                           |
| --useSchematicConfig      | boolean             | No       | `true`                          | Create a schematics configuration file. If `false`, registration and helper settings go in `angular.json`, no content union is created, and you set up the [`schema` generator](/fundamentals/schema) by hand.                    |
| --schematicsConfigPath    | string              | No       | `app`                           | Folder for the schematics configuration file. See [Paths](#paths).                                                                                                                                                                |
| --schematicConfigFileName | string              | No       | `formbar-schematic.config.json` | Name of the schematics configuration file.                                                                                                                                                                                        |
| --installSchematics       | boolean             | No       | `true`                          | Whether to install `@ngx-formbar/schematics` as a dev dependency for the control, group, block, array, register, and schema generators.                                                                                           |

## Paths

{% include "../../../shared/paths.md" %}

## Manual Installation

For manual setup and configuration, see the [Manual Setup guide](/reactive-forms/getting-started/manual-setup).
