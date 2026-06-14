While the Generator Schematics, by default, already register every new component, you may not always use them. In those cases you can either manually register them or use this schematic.

## What Does It Do

This schematic tries to find all relevant controls and registers them at the appropriate place. It does **not** discover validators. Those must always be registered manually.

## Options

| Option                 | Type                | Required | Default (control/group/block) | Description                                                                                                                                                                                                                                                                                          |
| ---------------------- | ------------------- | -------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| --project              | string              | No       | workspace default project     | Angular project name where files are generated.                                                                                                                                                                                                                                                      |
| --registrationType     | 'token' \| 'config' | No       | 'token'                       | Which registration type is used.                                                                                                                                                                                                                                                                    |
| --controlRegistrations | string              | No       | -                             | Path to the registration file that should be used. If this is not provided, the schematic will try to resolve it from the default locations.                                                                                                                                                         |
| --schematicsConfig     | string              | No       | -                             | Path of the schematics configuration, relative to the project root, that is to be used by this schematic. If this parameter is left out, the schematic will try to resolve the file from its default location. Configuration set in this file will override all duplicate options passed to the CLI. |
| --include              | array               | No       | `["\*\*/*.ts"]`               | Glob patterns to include when searching for components                                                                                                                                                                                                                                               |
| --exclude              | array               | No       | `[]`                          | Glob patterns to exclude when searching for components (node_modules and spec files will always be excluded.                                                                                                                                                                                         |

## Setting Options

There are two ways to set custom default options, avoiding repeated parameters on every CLI command.

### In formbar-schematic.config.json

All options are optional, but are listed here in full. You can put any combination of them.

```json name="formbar-schematic.config.json"
{
  "registrationType": "token",
  "controlRegistrationsPath": "app/form/registrations.ts",
  "discovery": {
    "include": ["**/components/form/controls/**"],
    "exclude": ["**/components/form/controls/secret/**"]
  }
}
```

### In angular.json

You can set default values for any ngx-formbar schematic option in your `angular.json`. Add a `schematics` section under your project with the schematic name and desired defaults.

All options are optional, but are listed here in full. You can put any combination of them.
Note, that compared to `formbar-schematic.config.json`, you have to repeat all values.

```json name="angular.json"
{
  "projects": {
    "my-app": {
      "schematics": {
        "@ngx-formbar/schematics:register": {
          "registrationType": "token",
          "controlRegistrationsPath": "app/form/registrations.ts",
          "include": ["**/components/form/controls/**"],
          "exclude": ["**/components/form/controls/secret/**"]
        }
      }
    }
  }
}
```

## Resolving Options

{% include "../../shared/resolving-options.md" %}
