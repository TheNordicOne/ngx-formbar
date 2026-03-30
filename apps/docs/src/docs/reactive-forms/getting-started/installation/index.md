## Compatibility

At this time this package is compatible with Angular 19.2.0 up to (but not including) Angular 22.

## Primary Installation via ng-add

Running the following command will install _ngx-formbar_.

```shell
ng add @ngx-formbar/reactive-forms
```

By default, the following things will be done

- Install `@ngx-formbar/reactive-forms` as a dependency (`@ngx-formbar/core` is included as a peer dependency)
- Install `@ngx-formbar/schematics` as a dev dependency (for component generators)
- Create a registration configuration file
- Setup token based registration including
  - barrel export
  - component registration
  - validator registration
  - async validator registration
- Setup helper files including
  - barrel export
  - control host directives
  - control container view provider
- Create a schematics configuration file
- Provide formbar in your `app.config.ts`
- Install dependencies

> **Note**
> The schematics configuration file will only contain values, that differ from the default.

> **Note**
> When setting the `helperPath` option only set it to a folder path. If you want to later adjust how the files or exports are named, update the configuration afterward. Take a look at Notes for Path Options in the [Generators page](/fundamentals/generators) to learn how this works.

## Options

| Option                    | Type                | Required | Default                   | Description                                                                                                                                                                                                              |
|---------------------------|---------------------|----------|---------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| --project                 | string              | No       | workspace default project | Angular project to add ngx-formbar to.                                                                                                                                                                                   |
| --registrationStyle       | `token` \| `config` | No       | `token`                   | The registration style to be used.                                                                                                                                                                                       |
| --provideInline           | boolean             | No       | `false`                   | Put the provider configuration object of `provideFormbar` inline, instead of putting it in a separate file.                                                                                                              |
| --providerConfigPath      | string              | No       | `app`                     | Where the provider configuration file should be placed, relative to the project root.                                                                                                                                    |
| --providerConfigFileName  | string              | No       | `formbar.config.ts`       | Name of the provider configuration file.                                                                                                                                                                                 |
| --includeSyncValidators   | boolean             | No       | `true`                    | Whether to include the setup for validators.                                                                                                                                                                             |
| --includeAsyncValidators  | boolean             | No       | `true`                    | Whether to include the setup for async validators.                                                                                                                                                                       |
| --useHelper               | boolean             | No       | `true`                    | Include helper files for view providers and host directives.                                                                                                                                                             |
| --helperPath              | string              | No       | `app/shared/helper`       | Where helper files should be placed, relative to the project root.                                                                                                                                                       |
| --splitRegistrations      | boolean             | No       | `true`                    | Whether to split the registrations into a separate file. If false, registrations will happen directly in the `formbar.config.ts` or `app.config.ts`, depending on the registration style and the `provideInline` option. |
| --registrationsPath       | string              | No       | `app/registrations`       | Where registration files should be placed, relative to the project root.                                                                                                                                                 |
| --useSchematicConfig      | boolean             | No       | `true`                    | Whether to include an extra file for schematics configuration. If set to false, all configuration for the schematics will be set up in `angular.json`.                                                                   |
| --schematicsConfigPath    | string              | No       | `app`                     | Where the schematics config should be placed, relative to the project root.                                                                                                                                              |
| --schematicConfigFileName | string              | No       | `formbar.config.json`     | Name of the schematic config file.                                                                                                                                                                                       |
| --installSchematics       | boolean             | No       | `true`                    | Whether to install `@ngx-formbar/schematics` as a dev dependency for component generators (control, group, block).                                                                                                       |


## Manual Installation

For manual setup and configuration, see the [Manual Setup guide](/reactive-forms/getting-started/manual-setup).
