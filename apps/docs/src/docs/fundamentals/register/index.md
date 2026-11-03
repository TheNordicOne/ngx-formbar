While the Generator Schematics, by default, already register every new component, you may not always use them. In those cases you can either manually register them or use this schematic.

## What Does It Do

This schematic tries to find all relevant controls and registers them at the appropriate place. It does **not** discover validators. Those must always be registered manually.

It looks through the source root of the project and skips any other project inside it.

Each control is registered under the `type` of its config interface, as a form refers to it:

| The component                                                            | Registered as    |
| ------------------------------------------------------------------------ | ---------------- |
| `implements ReactiveFormbarControl<SliderConfig>`, with `type: 'slider'` | `slider`         |
| `class RatingComponent`, with no such interface                          | `rating`         |
| `class RatingControl`, with no such interface                            | `rating-control` |

## Options

| Option                     | Type                | Required | Default                             | Description                                                                                                                  |
| -------------------------- | ------------------- | -------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| --project                  | string              | No       | [Default Project](#default-project) | Angular project to register components in.                                                                                   |
| --registrationType         | 'token' \| 'config' | No       | 'token'                             | Which registration type is used.                                                                                             |
| --controlRegistrationsPath | string              | No       | -                                   | The component registrations file. See [Paths](#paths) and [Default Registration Locations](#default-registration-locations). |
| --controlRegistrations     | string              | No       | -                                   | The same as `--controlRegistrationsPath`.                                                                                    |
| --schematicsConfig         | string              | No       | -                                   | The schematics configuration file to use. See [Finding the Schematics Configuration](#finding-the-schematics-configuration). |
| --include                  | array               | No       | `["\*\*/*.ts"]`                     | Files to search. See [Discovery Globs](#discovery-globs).                                                                    |
| --exclude                  | array               | No       | `[]`                                | Files to skip, on top of node_modules and spec files. See [Discovery Globs](#discovery-globs).                               |

## Setting Options

There are two ways to set custom default options, avoiding repeated parameters on every CLI command.

### In formbar-schematic.config.json

All options are optional, but are listed here in full. You can put any combination of them.

Every path in this file follows [Paths](#paths).

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

## Default Project

{% include "../../shared/default-project.md" %}

## Paths

{% include "../../shared/paths.md" %}

## Discovery Globs

`--include`, `--exclude` and `discovery` take paths with `*`, `**`, `?` and `[]`, so they follow [Paths](#paths) too:

| With source root `src`, you write | It matches                                    |
| --------------------------------- | --------------------------------------------- |
| `app/slider/**`                   | Everything in `src/app/slider`                |
| `src/app/slider/**`               | Everything in `src/app/slider`                |
| `**/slider/**`                    | Everything in any `slider` folder below `src` |

## Default Registration Locations

{% include "../../shared/default-registrations.md" %}

## Finding the Schematics Configuration

{% include "../../shared/config-discovery.md" %}

## Resolving Options

{% include "../../shared/resolving-options.md" %}
