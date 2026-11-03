_ngx-formbar_ includes four generator schematics that scaffold and register a new control, group, block, or array, plus a [`schema` generator](/fundamentals/schema) that runs pluggable emitters over your content union.

## Options

`control`, `group`, `block` and `array` support these options. Only `control`, `group` and `array` support `--viewProviderHelperPath`.

| Option                     | Type                | Required | Default (control/group/block/array)                             | Description                                                                                                                               |
| -------------------------- | ------------------- | -------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| --key                      | string              | Yes      | -                                                               | Registration key used in the Formbar configuration.                                                                                       |
| --name                     | string              | No       | `key`                                                           | Base name for component and config interface.                                                                                             |
| --project                  | string              | No       | [Default Project](#default-project)                             | Angular project name where files are generated.                                                                                           |
| --registrationType         | `token` \| `config` | No       | `token`                                                         | How the component is registered.                                                                                                          |
| --controlRegistrationsPath | string              | No       | -                                                               | The component registrations file. See [Paths](#paths) and [Default Registration Locations](#default-registration-locations).              |
| --path                     | string              | No       | `app` in the source root                                        | The directory the component's own directory is created in. See [Where Components Go](#where-components-go).                               |
| --interfaceSuffix          | string              | No       | `ControlConfig` / `GroupConfig` / `BlockConfig` / `ArrayConfig` | Suffix appended to the config interface name.                                                                                             |
| --componentSuffix          | string              | No       | `Control` / `Group` / `Block` / `Array`                         | Suffix appended to the component name.                                                                                                    |
| --interfaceFileSuffix      | string              | No       | derived (see Naming)                                            | Segment before `.ts` in the interface file name (e.g. `type` gives `name.type.ts`). See Naming.                                           |
| --viewProviderHelperPath   | string              | No       | -                                                               | The view provider helper of a control, group or array. Without it, the component declares the view providers itself. See [Paths](#paths). |
| --schematicsConfig         | string              | No       | -                                                               | The schematics configuration file to use. See [Finding the Schematics Configuration](#finding-the-schematics-configuration).              |
| --skipRegistration         | boolean             | No       | `false`                                                         | Skip automatic registration. You will have to register the component yourself or run the Register Schematic                               |

### Notes for the View Provider Path Option

`viewProviderHelperPath` takes one of these forms. It follows [Paths](#paths).

| You write                                             | The helper is                                                                                                         |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `app/shared/helper`                                   | The export `viewProviders` of `index.ts` in that folder if it has one, otherwise of `view-provider.ts` in that folder |
| `app/shared/helper/form-helpers.ts`                   | The export `viewProviders` of that file                                                                               |
| `app/shared/helper/form-helpers.ts#formViewProviders` | The export `formViewProviders` of that file                                                                           |

When the helper file cannot be found, the generator logs a warning naming the resolved path, and the component declares the view providers itself.

## Default Project

{% include "../../shared/default-project.md" %}

## Paths

{% include "../../shared/paths.md" %}

## Default Registration Locations

{% include "../../shared/default-registrations.md" %}

## Where Components Go

`--path` follows these tables, not [Paths](#paths). They show where `ng generate @ngx-formbar/schematics:control --key slider` writes.

With the default `ng new` layout, where the project is the workspace root and its source root is `src`:

| Run                         | The component goes in  |
| --------------------------- | ---------------------- |
| From the workspace root     | `src/app/slider`       |
| From `src/app/forms`        | `src/app/forms/slider` |
| With `--path src/app/forms` | `src/app/forms/slider` |
| With `--path app/forms`     | `app/forms/slider`     |
| With `--path /forms`        | `forms/slider`         |

With a project at `projects/my-app` and its source root at `projects/my-app/src`:

| Run                                     | The component goes in                           |
| --------------------------------------- | ----------------------------------------------- |
| From the workspace root                 | `projects/my-app/src/app/slider`                |
| From `projects/my-app/src/app/forms`    | `projects/my-app/src/app/forms/slider`          |
| With `--path projects/my-app/tools`     | `projects/my-app/tools/slider`                  |
| With `--path forms`                     | `projects/my-app/src/forms/slider`              |
| With `--path /forms`                    | `forms/slider`                                  |
| With `--path projects/other-app/forms`  | Fails, because that lies inside another project |
| With `--path /projects/other-app/forms` | Fails, because that lies inside another project |

`register` only finds components in the source root, so it skips a component written anywhere else.

## Naming

The generated **component** follows Angular's own component naming. The generators read Angular's `@schematics/angular:component` settings from `angular.json`, so you configure this the same way you configure `ng generate component`. The `type` value is the file and class suffix, `addTypeToClassName` gates whether the class gets it, and a project-level entry takes precedence over a workspace-level one. For `generate control --key text`:

| `angular.json` `type`        | `addTypeToClassName` | File                        | Class                  |
| ---------------------------- | -------------------- | --------------------------- | ---------------------- |
| unset (Angular v20+ default) | -                    | `text-control.ts`           | `TextControl`          |
| `"component"`                | `true` (default)     | `text-control.component.ts` | `TextControlComponent` |
| `"component"`                | `false`              | `text-control.component.ts` | `TextControl`          |

The generated **config interface** is named after the control with a `Config` suffix (`TextControlConfig`) and lives in its own file. The file gets a matching type segment, defaulting to `type` but applied only when the component has a type suffix:

| Angular `type` set? | Interface file (`interfaceFileSuffix` unset) |
| ------------------- | -------------------------------------------- |
| no                  | `text-control-config.ts`                     |
| yes                 | `text-control-config.type.ts`                |

Override the segment with `interfaceFileSuffix` (set it to an empty string to drop the segment).

## Examples

### Generating a Control

Run:

```bash
ng generate @ngx-formbar/schematics:control --key text
```

This will:

- Scaffold the config interface (e.g. `TextControlConfig`) extending `NgxFbControl`, in its own file.
- Generate the component (e.g. class `TextControl`, file `text-control.ts`) implementing `ReactiveFormbarControl<...>` with signal `input()` fields. See [Naming](#naming) for the file and class naming.
- Register the new control in your Formbar configuration under `componentRegistrations` with the given key.

For implementation details and advanced usage, see the [Controls](/reactive-forms/guides/controls) guide.

### Generating a Group

Run:

```bash
ng generate @ngx-formbar/schematics:group --key layout
```

This will:

- Scaffold the config interface (e.g. `LayoutGroupConfig`) extending `NgxFbFormGroup`, in its own file.
- Generate the component (e.g. class `LayoutGroup`, file `layout-group.ts`) implementing `ReactiveFormbarGroup<...>` with signal `input()` fields, and a template that renders child controls via `<ngxfb-control-outlet />`. See [Naming](#naming) for the file and class naming.
- Register the new group in your Formbar configuration under `componentRegistrations` with the given key.

For implementation details and advanced usage, see the [Groups](/reactive-forms/guides/groups) guide.

### Generating a Block

Run:

```bash
ng generate @ngx-formbar/schematics:block --key note
```

This will:

- Scaffold the config interface (e.g. `NoteBlockConfig`) extending `NgxFbBlock`, in its own file.
- Generate the component (e.g. class `NoteBlock`, file `note-block.ts`) implementing `FormbarBlock<...>` with signal `input()` fields. See [Naming](#naming) for the file and class naming.
- Register the new block in your Formbar configuration under `componentRegistrations` with the given key.

For implementation details and advanced usage, see the [Blocks](/reactive-forms/guides/blocks) guide.

### Generating an Array

Run:

```bash
ng generate @ngx-formbar/schematics:array --key tags
```

This will:

- Scaffold the config interface (e.g. `TagsArrayConfig`) extending `NgxFbArray`, in its own file.
- Generate the component (e.g. class `TagsArray`, file `tags-array.ts`) implementing `ReactiveFormbarArray<...>` with signal `input()` fields, and a minimal template that renders each row via `<ngxfb-form-array-outlet [index]>`. The row markup and the add and remove controls are left for you to add. See [Naming](#naming) for the file and class naming.
- Register the new array in your Formbar configuration under `componentRegistrations` with the given key.

For implementation details and advanced usage, see the [Arrays](/reactive-forms/guides/arrays) guide.

## Setting Options

There are two ways to set custom default options, avoiding repeated parameters on every CLI command.

### In the Schematics Configuration File

Every option is optional.

```json name="formbar-schematic.config.json"
{
  "registrationType": "config",
  "controlRegistrationsPath": "app/form/registrations.ts",
  "viewProviderHelperPath": "app/shared/helper/control-container.view-provider.ts#controlContainerViewProviders",
  "control": {
    "path": "app/forms",
    "interfaceSuffix": "Type",
    "componentSuffix": "Input",
    "interfaceFileSuffix": "type",
    "skipRegistration": true
  },
  "group": {
    "interfaceSuffix": "GroupType",
    "componentSuffix": "Group",
    "interfaceFileSuffix": "type",
    "skipRegistration": true
  },
  "block": {
    "interfaceSuffix": "BlockType",
    "componentSuffix": "Block",
    "interfaceFileSuffix": "type",
    "skipRegistration": true
  },
  "array": {
    "interfaceSuffix": "ArrayType",
    "componentSuffix": "Array",
    "interfaceFileSuffix": "type",
    "skipRegistration": true
  }
}
```

The `path` key in a generator section takes precedence over `--path`. It follows [Paths](#paths), like every other path in this file.

### In angular.json

You can set default values for any _ngx-formbar_ schematic option in your `angular.json`. Add a `schematics` section under your project with the schematic name and desired defaults.

Every option is optional.
Note, that compared to the schematics configuration file, you have to repeat all values.

This example is for a project at `projects/my-app`. `path` is a value for `--path`, so it follows [Where Components Go](#where-components-go). The other paths follow [Paths](#paths).

```json name="angular.json"
{
  "projects": {
    "my-app": {
      "schematics": {
        "@ngx-formbar/schematics:control": {
          "path": "projects/my-app/src/app/forms",
          "registrationType": "config",
          "controlRegistrationsPath": "app/form/registrations.ts",
          "viewProviderHelperPath": "app/shared/helper/control-container.view-provider.ts#controlContainerViewProviders",
          "interfaceSuffix": "Type",
          "componentSuffix": "Input",
          "interfaceFileSuffix": "type",
          "skipRegistration": true,
          "schematicsConfig": "config/formbar-schematic.config.json"
        },
        "@ngx-formbar/schematics:group": {
          "path": "projects/my-app/src/app/forms",
          "registrationType": "config",
          "controlRegistrationsPath": "app/form/registrations.ts",
          "viewProviderHelperPath": "app/shared/helper/control-container.view-provider.ts#controlContainerViewProviders",
          "interfaceSuffix": "GroupType",
          "componentSuffix": "Group",
          "interfaceFileSuffix": "type",
          "skipRegistration": true,
          "schematicsConfig": "config/formbar-schematic.config.json"
        },
        "@ngx-formbar/schematics:block": {
          "path": "projects/my-app/src/app/forms",
          "registrationType": "config",
          "controlRegistrationsPath": "app/form/registrations.ts",
          "interfaceSuffix": "BlockType",
          "componentSuffix": "Block",
          "interfaceFileSuffix": "type",
          "skipRegistration": true,
          "schematicsConfig": "config/formbar-schematic.config.json"
        },
        "@ngx-formbar/schematics:array": {
          "path": "projects/my-app/src/app/forms",
          "registrationType": "config",
          "controlRegistrationsPath": "app/form/registrations.ts",
          "viewProviderHelperPath": "app/shared/helper/control-container.view-provider.ts#controlContainerViewProviders",
          "interfaceSuffix": "ArrayType",
          "componentSuffix": "Array",
          "interfaceFileSuffix": "type",
          "skipRegistration": true,
          "schematicsConfig": "config/formbar-schematic.config.json"
        }
      }
    }
  }
}
```

## Finding the Schematics Configuration

{% include "../../shared/config-discovery.md" %}

## Resolving Options

{% include "../../shared/resolving-options.md" %}
