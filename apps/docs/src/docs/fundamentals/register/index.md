While the Generator Schematics, by default, already register every new component, you may not always use them. In those cases you can either manually register them or use this schematic.

## What Does It Do

This schematic registers every component that implements one of `ReactiveFormbarControl`, `ReactiveFormbarGroup`, `ReactiveFormbarArray` or `FormbarBlock`, also through a base class or a type of your own.

Any other component is left alone, such as a page that hosts `<ngxfb-form>`. It does **not** discover validators. Those must always be registered manually.

It looks through the source root of the project and skips any other project inside it.

It skips abstract classes. It also skips a class that is not a named export, such as `export default class`, with a warning naming the class, as a registration imports it by name.

A component it cannot read a contract from is skipped too. If its file mentions one of the contracts, a warning names the class.

Each component is registered under the `type` of its config, as a form refers to it. A config without one `type` value gets its key from the class name, and a warning names the class and the key:

| The component                                                                                                       | Registered as    |
| ------------------------------------------------------------------------------------------------------------------- | ---------------- |
| `implements ReactiveFormbarControl<SliderConfig>`, with `type: 'slider'`                                            | `slider`         |
| `extends BaseControl`, where `BaseControl` implements `ReactiveFormbarControl<SliderConfig>`, with `type: 'slider'` | `slider`         |
| `class RatingComponent implements ReactiveFormbarControl<RatingConfig>`, with `type: string`                        | `rating`         |
| `class RatingControl implements ReactiveFormbarControl<RatingConfig>`, with `type: string`                          | `rating-control` |

## Options

| Option                     | Type                | Required | Default                             | Description                                                                                                                                                                                                            |
| -------------------------- | ------------------- | -------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| --project                  | string              | No       | [Default Project](#default-project) | Angular project to register components in.                                                                                                                                                                             |
| --registrationType         | 'token' \| 'config' | No       | 'token'                             | How components are registered. `token` adds them to an injection token, `config` adds them to the config passed to `provideFormbar()`. See [Registration Types](/fundamentals/configuring-formbar#registration-types). |
| --controlRegistrationsPath | string              | No       | -                                   | The component registrations file. See [Paths](#paths) and [Default Registration Locations](#default-registration-locations).                                                                                           |
| --controlRegistrations     | string              | No       | -                                   | The same as `--controlRegistrationsPath`.                                                                                                                                                                              |
| --schematicsConfig         | string              | No       | -                                   | The schematics configuration file to use. See [Finding the Schematics Configuration](#finding-the-schematics-configuration).                                                                                           |
| --include                  | array               | No       | `["**/*.ts"]`                       | Files to search. See [Discovery Globs](#discovery-globs).                                                                                                                                                              |
| --exclude                  | array               | No       | `[]`                                | Files to skip, on top of node_modules and spec files. See [Discovery Globs](#discovery-globs).                                                                                                                         |

## Setting Options

There are two ways to set custom default options, avoiding repeated parameters on every CLI command.

### In formbar-schematic.config.json

Every option is optional.

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

Every option is optional.

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
| `app/slider`                      | Everything in `src/app/slider`                |
| `app/slider/**`                   | Everything in `src/app/slider`                |
| `src/app/slider/**`               | Everything in `src/app/slider`                |
| `**/slider/**`                    | Everything in any `slider` folder below `src` |

`register` only finds components in the source root, so an `--include` outside it fails.

## Default Registration Locations

{% include "../../shared/default-registrations.md" %}

## Finding the Schematics Configuration

{% include "../../shared/config-discovery.md" %}

## Resolving Options

{% include "../../shared/resolving-options.md" %}
