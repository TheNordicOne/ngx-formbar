ngx-formbar includes four generator schematics that scaffold and register a new control, group, block, or array.

## Options

All four schematics (`control`, `group`, `block`, `array`) support the same options:

| Option                   | Type    | Required | Default (control/group/block/array)     | Description                                                                                                                                                                                                                                                                                          |
|--------------------------|---------|----------|-----------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| --key                    | string  | Yes      | -                                       | Registration key used in the Formbar configuration.                                                                                                                                                                                                                                                  |
| --name                   | string  | No       | `key`                                   | Base name for component and interface.                                                                                                                                                                                                                                                               |
| --project                | string  | No       | workspace default project               | Angular project name where files are generated.                                                                                                                                                                                                                                                      |
| --path                   | string  | No       | current working directory               | Path to where the generated files will be placed.                                                                                                                                                                                                                                                    |
| --interfaceSuffix        | string  | No       | `Control` / `Group` / `Block` / `Array` | Suffix appended to the interface name.                                                                                                                                                                                                                                                               |
| --componentSuffix        | string  | No       | `Control` / `Group` / `Block` / `Array` | Suffix appended to the component class name.                                                                                                                                                                                                                                                         |
| --viewProviderHelperPath | string  | No       | -                                       | Path to the viewProvider helper, relative to the project root. If the file cannot be found or the option was not provided, it will fall back to using the verbose syntax.                                                                                                                            |
| --schematicsConfig       | string  | No       | -                                       | Path of the schematics configuration, relative to the project root, that is to be used by this schematic. If this parameter is left out, the schematic will try to resolve the file from its default location. Configuration set in this file will override all duplicate options passed to the CLI. |
| --skipRegistration       | boolean | No       | `false`                                 | Skip automatic registration. You will have to register the component yourself or run the Register Schematic                                                                                                                                                                                          |

### Notes for the View Provider Path Option

The path for `viewProviderHelperPath` can have three different shapes, that all resolve differently.

These are the relevant default values:

- View Provider Helper File Name: `view-provider.ts`
- View Provider Identifier: `viewProviders`

#### Folder

Shape: `path/to/helper/folder`

This will resolve to the folder path and assumes the helper files are set up with the default names and identifiers.

If an `index.ts` exists, it will use this for the import. Otherwise, it falls back to importing from the helper file directly.

#### Folder and File

Shape: `path/to/helper/folder/file-name.ts`

This will resolve to the file path and assumes the helper files are set up with the default identifier.

If an `index.ts` exists, it will use this for the import. Otherwise, it falls back to importing from the helper file directly.

#### Folder, File and Identifier

Shape: `path/to/helper/folder/file-name.ts#customIdentifier`

This will resolve to the file path and use the identifier as is. Make sure the spelling matches exactly that of the exported name

If an `index.ts` exists, it will use this for the import. Otherwise, it falls back to importing from the helper file directly.

## Examples

### Generating a Control

Run:

```bash
ng generate @ngx-formbar/schematics:control --key <control-key> [--name <ComponentName>] [--project <project>] [--path <path>] [--interface-suffix <suffix>] [--component-suffix <suffix>]
```

This will:

- Scaffold an interface `<name><interfaceSuffix>.ts` extending `NgxFbControl`.
- Generate component files (`.component.ts`, `.html`, `.scss`, `.spec.ts`) implementing `ReactiveFormbarControl<...>` with signal `input()` fields.
- Register the new control in your Formbar configuration under `componentRegistrations` with the given key.

For implementation details and advanced usage, see the [Controls](/reactive-forms/guides/controls) guide.

### Generating a Group

Run:

```bash
ng generate @ngx-formbar/schematics:group --key <group-key> [--name <ComponentName>] [--project <project>] [--path <path>] [--interface-suffix <suffix>] [--component-suffix <suffix>]
```

This will:

- Scaffold an interface `<name><interfaceSuffix>.ts` extending `NgxFbFormGroup`.
- Generate component files (`.component.ts`, `.html`, `.scss`, `.spec.ts`) implementing `ReactiveFormbarGroup<...>` with signal `input()` fields, and a template that renders child controls via `<ngxfb-control-outlet />`.
- Register the new group in your Formbar configuration under `componentRegistrations` with the given key.

For implementation details and advanced usage, see the [Groups](/reactive-forms/guides/groups) guide.

### Generating a Block

Run:

```bash
ng generate @ngx-formbar/schematics:block --key <block-key> [--name <ComponentName>] [--project <project>] [--path <path>] [--interface-suffix <suffix>] [--component-suffix <suffix>]
```

This will:

- Scaffold an interface `<name><interfaceSuffix>.ts` extending `NgxFbBlock`.
- Generate component files (`.component.ts`, `.html`, `.scss`, `.spec.ts`) implementing `FormbarBlock<...>` with signal `input()` fields.
- Register the new block in your Formbar configuration under `componentRegistrations` with the given key.

For implementation details and advanced usage, see the [Blocks](/reactive-forms/guides/blocks) guide.

### Generating an Array

Run:

```bash
ng generate @ngx-formbar/schematics:array --key <array-key> [--name <ComponentName>] [--project <project>] [--path <path>] [--interface-suffix <suffix>] [--component-suffix <suffix>]
```

This will:

- Scaffold an interface `<name><interfaceSuffix>.ts` extending `NgxFbArray`.
- Generate component files (`.component.ts`, `.html`) implementing `ReactiveFormbarArray<...>` with signal `input()` fields, and a minimal template that renders each row via `<ngxfb-form-array-outlet [index]>`. The row markup and the add and remove controls are left for you to add.
- Register the new array in your Formbar configuration under `componentRegistrations` with the given key.

For implementation details and advanced usage, see the [Arrays](/reactive-forms/guides/arrays) guide.

## Setting Options

There are two ways to set custom default options, avoiding repeated parameters on every CLI command.

### In formbar-schematic.config.json

All options are optional, but are listed here in full. You can put any combination of them.

```json name="formbar-schematic.config.json"
{
  "controlRegistrationsPath": "app/form/registrations.ts",
  "viewProviderHelperPath": "app/shared/helper/control-container.view-provider.ts",
  "control": {
    "interfaceSuffix": "Type",
    "componentSuffix": "Input",
    "skipRegistration": true
  },
  "group": {
    "interfaceSuffix": "GroupType",
    "componentSuffix": "Group",
    "skipRegistration": true
  },
  "block": {
    "interfaceSuffix": "BlockType",
    "componentSuffix": "Block",
    "skipRegistration": true
  },
  "array": {
    "interfaceSuffix": "ArrayType",
    "componentSuffix": "Array",
    "skipRegistration": true
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
        "@ngx-formbar/schematics:control": {
          "controlRegistrationsPath": "app/form/registrations.ts",
          "viewProviderHelperPath": "app/shared/helper/control-container.view-provider.ts",
          "interfaceSuffix": "Type",
          "componentSuffix": "Input",
          "skipRegistration": true
        },
        "@ngx-formbar/schematics:group": {
          "controlRegistrationsPath": "app/form/registrations.ts",
          "viewProviderHelperPath": "app/shared/helper/control-container.view-provider.ts",
          "interfaceSuffix": "GroupType",
          "componentSuffix": "Group",
          "skipRegistration": true
        },
        "@ngx-formbar/schematics:block": {
          "controlRegistrationsPath": "app/form/registrations.ts",
          "viewProviderHelperPath": "app/shared/helper/control-container.view-provider.ts",
          "interfaceSuffix": "BlockType",
          "componentSuffix": "Block",
          "skipRegistration": true
        },
        "@ngx-formbar/schematics:array": {
          "controlRegistrationsPath": "app/form/registrations.ts",
          "viewProviderHelperPath": "app/shared/helper/control-container.view-provider.ts",
          "interfaceSuffix": "ArrayType",
          "componentSuffix": "Array",
          "skipRegistration": true
        }
      }
    }
  }
}
```

## Resolving Options

{% include "../../shared/resolving-options.md" %}
