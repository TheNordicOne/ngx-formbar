## Compatibility

This package is compatible with Angular 20.0.0 up to (but not including) Angular 23.

## Primary Installation via ng-add

This command installs _ngx-formbar_.

```shell
ng add @ngx-formbar/reactive-forms
```

By default, this does the following.

- Install `@ngx-formbar/reactive-forms` as a dependency (`@ngx-formbar/core` is included as a peer dependency)
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
> The generators read registrations inside `provideFormbar` only from a config variable. With any other [root providers](#root-providers), `--registrationStyle=config --provideInline --splitRegistrations=false` keeps the registrations in their own files.

> **Note**
> When the generators would not [find the schematics configuration file](/fundamentals/generators#finding-the-schematics-configuration) where `ng add` writes it, `ng add` sets `schematicsConfig` for every generator in `angular.json`, and removes it again once it is no longer needed.

> **Note**
> A schematics configuration file wins over the `angular.json` settings written with `--useSchematicConfig=false`. `ng add` logs a warning naming the file when there is one.

> **Note**
> `helperPath` is a folder. To rename the files or exports later, see [Notes for the View Provider Path Option](/fundamentals/generators#notes-for-the-view-provider-path-option).

## Root Providers

`ng add` follows the bootstrap call in the project's main file, also into files that file imports, and edits:

| The bootstrap call                                  | `ng add` edits                                                                                       |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `bootstrapApplication(App, appConfig)`              | The `appConfig` variable, also through a barrel or a path alias                                      |
| `bootstrapApplication(App, { providers: [] })`      | The object                                                                                           |
| `bootstrapApplication(App)`                         | The call, which gets a config object                                                                 |
| `bootstrapApplication(App, makeConfig())`           | The call, as `bootstrapApplication(App, mergeApplicationConfig(makeConfig(), { providers: [...] }))` |
| `bootstrapApplication(App, { ...base })`            | The call, wrapped the same way                                                                       |
| `bootstrapApplication(App, configFromOtherProject)` | The call, wrapped the same way, so that no other project imports from this one                       |
| `platformBrowser().bootstrapModule(AppModule)`      | The `providers` of `AppModule`, also through a barrel or a path alias                                |
| None                                                | `app/app.config.ts` in the source root, with a warning naming it                                     |

A root NgModule has to be declared in the project, and its metadata has to be an object in the decorator without a spread. Otherwise `ng add` fails naming the file.

## Options

| Option                    | Type                | Required | Default                         | Description                                                                                                                                                                                                    |
| ------------------------- | ------------------- | -------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| --project                 | string              | No       | workspace default project       | Angular project to add _ngx-formbar_ to.                                                                                                                                                                       |
| --registrationStyle       | `token` \| `config` | No       | `token`                         | The registration style to be used.                                                                                                                                                                             |
| --provideInline           | boolean             | No       | `false`                         | Configure `provideFormbar` in the root providers, without a provider configuration file.                                                                                                                       |
| --providerConfigPath      | string              | No       | `app`                           | Folder for the provider configuration file. See [Paths](#paths).                                                                                                                                               |
| --providerConfigFileName  | string              | No       | `formbar.config.ts`             | Name of the provider configuration file.                                                                                                                                                                       |
| --includeSyncValidators   | boolean             | No       | `true`                          | Whether to include the setup for validators.                                                                                                                                                                   |
| --includeAsyncValidators  | boolean             | No       | `true`                          | Whether to include the setup for async validators.                                                                                                                                                             |
| --useHelper               | boolean             | No       | `true`                          | Include helper files for the view provider used by control and group components.                                                                                                                               |
| --helperPath              | string              | No       | `app/shared/helper`             | Folder for the helper files. See [Paths](#paths).                                                                                                                                                              |
| --splitRegistrations      | boolean             | No       | `true`                          | Put the registrations in their own files. If `false`, they go in the provider configuration file or the root providers.                                                                                        |
| --registrationsPath       | string              | No       | `app/registrations`             | Folder for the registration files. See [Paths](#paths).                                                                                                                                                        |
| --useSchematicConfig      | boolean             | No       | `true`                          | Create a schematics configuration file. If `false`, registration and helper settings go in `angular.json`, no content union is created, and you set up the [`schema` generator](/fundamentals/schema) by hand. |
| --schematicsConfigPath    | string              | No       | `app`                           | Folder for the schematics configuration file. See [Paths](#paths).                                                                                                                                             |
| --schematicConfigFileName | string              | No       | `formbar-schematic.config.json` | Name of the schematics configuration file.                                                                                                                                                                     |
| --installSchematics       | boolean             | No       | `true`                          | Whether to install `@ngx-formbar/schematics` as a dev dependency for the control, group, block, array, register, and schema generators.                                                                        |

## Paths

{% include "../../../shared/paths.md" %}

## Manual Installation

For manual setup and configuration, see the [Manual Setup guide](/reactive-forms/getting-started/manual-setup).
