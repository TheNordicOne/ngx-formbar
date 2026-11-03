The `schema` generator produces documents from your [content union](/fundamentals/configuration#type-generic). The two built-in emitters write JSON Schema. You can write your own emitter to produce any other output.

## Configuration

The `schema` section of `formbar-schematic.config.json` configures the generator:

```json name="formbar-schematic.config.json"
{
  "schema": {
    "type": "path/to/content-union.ts#AppContent",
    "emitters": [{ "use": "json-schema-2020-12", "output": "form.schema.json" }]
  }
}
```

| Name     | Type   | Required | Description                                                                      |
| -------- | ------ | -------- | -------------------------------------------------------------------------------- |
| type     | string | Yes      | The content union, as `path/to/file.ts#ExportName`. See [Paths](#paths).         |
| emitters | array  | No       | Emitter entries to run, in order. Without entries, the generator writes nothing. |

Each `emitters` entry, with paths as described in [Paths](#paths):

| Key       | Type     | Description                                                                           |
| --------- | -------- | ------------------------------------------------------------------------------------- |
| `use`     | `string` | The emitter to run: a built-in name, a package name, or a path to a local `.ts` file. |
| `output`  | `string` | The file to write. Without it, the emitter uses its default.                          |
| `options` | `object` | Passed to the emitter as `ctx.options`. See [Built-in Emitters](#built-in-emitters).  |

Each entry must write to its own file.

## Usage

```bash
ng generate @ngx-formbar/schematics:schema
```

This runs the configured emitters and writes their output. An empty union fails with a message telling you to scaffold a node first (see [Generators](/fundamentals/generators)).

The content union is compiled with the `tsConfig` of the project's `build` target, so its `paths` and `baseUrl` apply. Without one, the generator uses `tsconfig.app.json`, `tsconfig.lib.json` or `tsconfig.json` in the project root, then the workspace's `tsconfig.json`, then its `tsconfig.base.json`.

## Options

| Option             | Type   | Required | Default                   | Description                                                                                                                                                      |
| ------------------ | ------ | -------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| --project          | string | No       | workspace default project | Angular project name where files are generated.                                                                                                                  |
| --schematicsConfig | string | No       | -                         | The schematics configuration file, relative to the source root. Without it, the generator searches the workspace for `formbar-schematic.config.json`.            |
| --type             | string | No       | -                         | The content union, as `path/to/file.ts#ExportName`. Overrides `schema.type`. See [Paths](#paths).                                                                |
| --emitter          | array  | No       | -                         | Run only the configured emitter entries whose `use` matches one of these values. Repeat to select more than one. Fails when a value matches no configured entry. |
| --output           | string | No       | -                         | Override the output path of a single configured emitter entry. Narrow the run with `--emitter` first. See [Paths](#paths).                                       |

## Paths

`type`, `output` and a local `use` path are relative to the project's source root. A leading `/` means the workspace root. `--type` and `--output` work the same way.

With a source root of `src`:

| Key      | Value                                  | Resolves to                     |
| -------- | -------------------------------------- | ------------------------------- |
| `type`   | `app/types/content.type.ts#AppContent` | `src/app/types/content.type.ts` |
| `output` | `form.schema.json`                     | `src/form.schema.json`          |
| `output` | `/dist/form.schema.json`               | `dist/form.schema.json`         |
| `use`    | `./tools/my-emitter.ts`                | `src/tools/my-emitter.ts`       |
| `use`    | `/tools/my-emitter.ts`                 | `tools/my-emitter.ts`           |

A local `use` path must start with `./` or `/`. Anything else is read as a built-in name or a package name.

## Built-in Emitters

### JSON Schema

Two emitters ship with the package. Both write [JSON Schema](https://json-schema.org/) and take the same options:

| Emitter                | Draft    | Default output              |
| ---------------------- | -------- | --------------------------- |
| `json-schema-2020-12`  | 2020-12  | `form.schema.json`          |
| `json-schema-draft-07` | draft-07 | `form.schema.draft-07.json` |

The default output is relative to the source root.

| Option | Type      | Default | Description                     |
| ------ | --------- | ------- | ------------------------------- |
| `docs` | `boolean` | `true`  | Renders JSDoc as `description`. |

Both describe `NgxFbForm.content`. Each union member becomes a definition. The `type` you narrowed is enforced. Add a `$schema` key to your form config that references the generated file. Your editor then autocompletes and validates the config. You can do the same in CI.

## Third-Party Emitters

To use an emitter someone else published, point `use` at the package name:

```json name="formbar-schematic.config.json"
{
  "schema": {
    "type": "path/to/content-union.ts#AppContent",
    "emitters": [{ "use": "<emitter-package>" }]
  }
}
```

The package's default export is used. To use a named export, write `use: "<emitter-package>#<export-name>"`. The part after `#` is the module export name, not the emitter's `name` property.

## Custom Emitters

Skip this section if the built-in JSON Schema output is all you need. It describes the contract for writing your own emitter.

### A Minimal Emitter

An emitter is the module's default export: an object with a string `name` and an `emit(model, ctx)` method. Any object of that shape loads. `defineEmitter` returns the object unchanged and types `model` and `ctx`.

Save the emitter in your project. This one writes a Markdown reference of every node and its properties:

```typescript name="tools/content-overview-emitter.ts"
import { defineEmitter } from '@ngx-formbar/schematics';

export default defineEmitter({
  name: 'content-overview',
  emit(model, ctx) {
    const path = ctx.paths.output ?? `${ctx.paths.projectRoot}/content-overview.md`;
    const lines = Object.values(model.nodes).map((node) => {
      const properties = node.properties.map((property) => `${property.name}: ${property.type.k}`).join(', ');
      return `${node.name} (${node.kind}): ${properties}`;
    });
    const content = `${lines.join('\n')}\n`;

    if (ctx.tree.exists(path)) {
      ctx.tree.overwrite(path, content);
      return;
    }

    ctx.tree.create(path, content);
  },
});
```

Register it in the configuration by path:

```json name="formbar-schematic.config.json"
{
  "schema": {
    "type": "path/to/content-union.ts#AppContent",
    "emitters": [{ "use": "./tools/content-overview-emitter.ts", "output": "content-overview.md" }]
  }
}
```

### The Model

`emit` receives a `FormModel`, which is `{ root, nodes }`. `root` is a `TypeRef` that describes the union. `nodes` maps each declared type name to a `FormNode`:

| Name        | Type                                         | Description                                                                                                                                                                        |
| ----------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| name        | `string`                                     | The declared interface name. A generic used with more than one set of type arguments keeps them, as in `GroupControl<Inner>`.                                                      |
| kind        | `'control' \| 'group' \| 'array' \| 'block'` | Which core base the node extends.                                                                                                                                                  |
| typeLiteral | `string[] \| null`                           | The narrowed `type` literal or literals. Always an array (a single literal is a one-element list). `null` when `type` is left open.                                                |
| open        | `boolean`                                    | `true` when the node carries an index signature, as blocks do.                                                                                                                     |
| doc?        | `string`                                     | The node's JSDoc.                                                                                                                                                                  |
| properties  | `Property[]`                                 | Every property except `type` and the structural child property.                                                                                                                    |
| children    | `TypeRef`                                    | The child union, for groups and arrays. Absent for controls and blocks. A child typed as a core base, such as the default `NgxFbItem`, stands for every union member of that kind. |

Each `Property` is `{ name, optional, doc?, type }`.

`TypeRef` is `{ name, members, constraints?, memberConstraints? }`. `name` is the union alias, or `null` for an inline union. `members` is the list of member names. `constraints` and `memberConstraints` carry TypeScript intersection narrowings, such as an array row's `hideStrategy`. Most emitters can ignore them.

A property's `type` is a `TypeNode`, a discriminated union keyed on `k`:

| k        | Payload                                                       |
| -------- | ------------------------------------------------------------- |
| string   | -                                                             |
| number   | -                                                             |
| boolean  | -                                                             |
| null     | -                                                             |
| unknown  | -                                                             |
| any      | -                                                             |
| literal  | `value: string \| number \| boolean`                          |
| array    | `items: TypeNode`                                             |
| tuple    | `elements: TypeNode[]`, `minItems: number`, `rest?: TypeNode` |
| object   | `name?: string`, `properties: Property[]`, `index?: TypeNode` |
| union    | `members: TypeNode[]`                                         |
| function | -                                                             |
| never    | -                                                             |
| ref      | `node: string`                                                |
| cycle    | `name: string`                                                |

`function` is the predicate arm of `Expression<T>` (see [Expressions](/fundamentals/expressions)). `never` covers types with no JSON value, such as `bigint`. Both project to `null` in `toJsonTypes`.

Template literal types, `Uppercase<string>` and branded primitives such as `string & {}` map to their primitive. `object` maps to a union of an open object and an array, `{}` to a union of every non-null JSON type.

### The Context

| Name    | Type          | Description                                                                                                                                                |
| ------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| tree    | `Tree`        | Write files with `tree.create(path, content)` or `tree.overwrite(path, content)`. `create` fails when the file exists, so check `tree.exists(path)` first. |
| paths   | `EmitPaths`   | `{ workspaceRoot, projectRoot, output }`.                                                                                                                  |
| options | `EmitOptions` | `entry.options`, or `{}` without one.                                                                                                                      |
| logger  | `LoggerApi`   | The schematic logger, e.g. `ctx.logger.info('...')`.                                                                                                       |

`workspaceRoot` is the absolute on-disk path of the workspace, used to resolve package specifiers from `node_modules`. `projectRoot` is the project's source root (its root when it has none) exactly as `angular.json` declares it, relative to the workspace and without a leading `/` (for example `projects/<project>/src`). `output` is a `/`-rooted path in `ctx.tree` (for example `/projects/<project>/src/form.schema.json`), already resolved against the source root. It is `null` when the entry sets no `output`. Fall back to your own default, as the example does with `??`.

`toJsonTypes(type)` projects a `TypeNode` onto its JSON part, dropping `function` arms and collapsing one-arm unions. It returns `null` when no JSON value satisfies the type. Use it when producing JSON-shaped output.

> **Note**
> Emitters run inside the schematic transaction. A throw aborts the whole run and nothing is written, not this emitter's output, not the earlier emitters'. Only writes through `ctx.tree` appear in `--dry-run`. The Angular CLI does not expose a dry-run flag to schematics, so the generator has none of its own.

### Sharing an Emitter as a Package

To let other projects use your emitter, publish it as an npm package. The entry point exports the emitter with `defineEmitter`:

```typescript name="index.ts"
import { defineEmitter } from '@ngx-formbar/schematics';

export default defineEmitter({
  name: 'form-docs',
  emit(model, ctx) {
    const path = ctx.paths.output ?? `${ctx.paths.projectRoot}/form-docs.md`;
    const headings = Object.values(model.nodes).map((node) => `## ${node.name}`);
    const content = `${headings.join('\n')}\n`;

    if (ctx.tree.exists(path)) {
      ctx.tree.overwrite(path, content);
      return;
    }

    ctx.tree.create(path, content);
  },
});
```

List `@ngx-formbar/schematics` as a devDependency of the package so the import type-checks. Consumers then use it as described in [Third-Party Emitters](#third-party-emitters).
