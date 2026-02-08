{% raw %}
While the Generator Schematics, per default, already register every new component, you may not always use them. In those cases you could either manually register them or use this schematic.

## What does it do

This schematic tries to find all relevant controls and registers them at the appropriate place. It does **not** discover validators. Those always have to be manually registered.

## Options

| Option                 | Type                | Required | Default (control/group/block) | Description                                                                                                                                                                                                                                                                                          |
|------------------------|---------------------|----------|-------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| --project              | string              | No       | workspace default project     | Angular project name where files are generated.                                                                                                                                                                                                                                                      |
| --registrationStyle    | 'token' \| 'config' | No       | 'token'                       | Which registration style is used.                                                                                                                                                                                                                                                                    |
| --controlRegistrations | string              | No       | -                             | Path to the registration file that should be used. If this is not provided, the schematic will try to resolve it from the default locations.                                                                                                                                                         |
| --schematicsConfig     | string              | No       | -                             | Path of the schematics configuration, relative to the project root, that is to be used by this schematic. If this parameter is left out, the schematic will try to resolve the file from its default location. Configuration set in this file will override all duplicate options passed to the CLI. |
| --include              | array               | No       | `["&#42;&#42;/*.ts"]`         | Glob patterns to include when searching for components                                                                                                                                                                                                                                               |
| --exclude              | array               | No       | `[]`                          | Glob patterns to exclude when searching for components (node_modules and spec files will always be excluded.                                                                                                                                                                                          |

## Setting Options

There are two ways to set custom default options. This helps repeating the same parameters on every CLI command.

### In `formbar.config.json`

All options are optional, but are listed here in full. You can put any combination of them.

```json
// formbar.config.json
{
  "registrationType": "map",
  "controlRegistrationsPath": "app/form/registrations.ts",
  "discovery": {
    "include": ["&#42;&#42;/components/form/controls/&#42;&#42;"],
    "exclude": ["&#42;&#42;/components/form/controls/secret/&#42;&#42;"]
  }
}
```

### In `angular.json`

You can set default values for any ngx-formbar schematic option in your `angular.json`. Add a `schematics` section under your project with the schematic name and desired defaults.

All options are optional, but are listed here in full. You can put any combination of them.
Note, that compared to `formbar.config.json`, you have to repeat all values.

```json
// angular.json
{
  "projects": {
    "my-app": {
      "schematics": {
        "@ngx-formbar/core:register": {
          "registrationType": "map",
          "controlRegistrationsPath": "app/form/registrations.ts",
          "include": ["**/components/form/controls/**"],
          "exclude": ["**/components/form/controls/secret/**"]
        }
      }
    }
  }
}
```


## Resolving options

Due to the current implementation and how the default values are set, the options are resolved in the following cascading order.

1. Values from `angular.json`
2. CLI Options
3. Values from `formbar.config.json`

In other words: Values from `formbar.config.json` overwrite values from the CLI Options, which overwrite values from the `angular.json`.

{% endraw %}
