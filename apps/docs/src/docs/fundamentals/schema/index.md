The `schema` generator produces documents from your [content union](/fundamentals/configuration#type-generic). The two built-in emitters write JSON Schema. You can write your own emitter to produce any other output.

## Configuration

The `schema` section of `formbar-schematic.config.json` configures the generator:

```json name="formbar-schematic.config.json"
{
  "schema": {
    "type": "path/to/content-union.ts#AppContent",
    "docs": true,
    "emitters": [
      { "use": "json-schema-2020-12", "output": "form.schema.json" }
    ]
  }
}
```

| Name     | Type    | Required | Description                                                                                                      |
| -------- | ------- | -------- | ---------------------------------------------------------------------------------------------------------------- |
| type     | string  | Yes      | Reference to the content union, as `path/to/file.ts#ExportName`, relative to the source root. |
| docs     | boolean | No       | Capture JSDoc onto nodes and properties. Defaults to `true`. The built-in JSON Schema emitters render it as `description`. |
| emitters | array   | No       | Emitter entries to run, in order. An empty list writes nothing. |

Each `emitters` entry:

| Name    | Type   | Description                                                                                                                                                             |
| ------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| use     | string | A built-in name, a path to a local `.ts` file (`.`- or `/`-prefixed), or a package specifier. Paths are relative to the source root. A leading `/` means workspace-absolute. |
| output  | string | Where the emitter writes, relative to the source root. A leading `/` means workspace-absolute. The built-in JSON Schema emitters default to `form.schema.json`.          |
| options | object | Extra options passed through to the emitter via `ctx.options`.                                                                                                          |

## Usage

```bash
ng generate @ngx-formbar/schematics:schema
```

This runs the configured emitters and writes their output. An empty union fails with a message telling you to scaffold a node first (see [Generators](/fundamentals/generators)).

## Options

| Option             | Type   | Required | Default                   | Description                                                                                                                                                                                                  |
| ------------------ | ------ | -------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| --project          | string | No       | workspace default project | Angular project name where files are generated.                                                                                                                                                              |
| --schematicsConfig | string | No       | -                         | Path of the schematics configuration, relative to the source root. If left out, the schematic discovers `formbar-schematic.config.json` in the project.                                                     |
| --type             | string | No       | -                         | Reference to the content union, as `path/to/file.ts#ExportName`, relative to the source root. Overrides `schema.type` from the configuration.                                                               |
| --emitter          | array  | No       | -                         | Run only the configured emitter entries whose `use` matches one of these values. Repeat to select more than one.                                                                                             |
| --output           | string | No       | -                         | Override the output path of a single configured emitter entry. Narrow the run with `--emitter` first.                                                                                                        |

## Built-in Emitters

Two emitters ship with the package. Both write [JSON Schema](https://json-schema.org/):

- `json-schema-2020-12` — draft 2020-12.
- `json-schema-draft-07` — draft-07.

Both describe `NgxFbForm.content`. Each union member becomes a definition. The `type` you narrowed is enforced. Add a `$schema` key to your form config that references the generated file. Your editor then autocompletes and validates the config. You can do the same in CI.

## Third-Party Emitters

To use an emitter someone else published, point `use` at the package name:

```json name="formbar-schematic.config.json"
{
  "schema": {
    "type": "path/to/content-union.ts#AppContent",
    "emitters": [
      { "use": "<emitter-package>" }
    ]
  }
}
```

The package's default export is used. To use a named export, write `use: "<emitter-package>#<export-name>"`. The part after `#` is the module export name, not the emitter's `name` property.

## Custom Emitters

Skip this section if the built-in JSON Schema output is all you need. It describes the contract for writing your own emitter.

### A Minimal Emitter

An emitter is an object with a `name` and an `emit(model, ctx)` method. The `defineEmitter` call is required. An emitter not created with it fails to load.

Save the emitter in your project. This one writes a Markdown reference of every node and its properties:

```typescript name="tools/content-overview-emitter.ts"
import { defineEmitter } from '@ngx-formbar/schematics';

export default defineEmitter({
  name: 'content-overview',
  emit(model, ctx) {
    const lines = Object.values(model.nodes).map((node) => {
      const properties = node.properties.map((p) => p.type.k).join(', ');
      return `${node.name} (${node.kind}): ${properties}`;
    });
    ctx.tree.create(
      ctx.paths.output ?? `${ctx.paths.projectRoot}/content-overview.md`,
      lines.join('\n') + '\n',
    );
  },
});
```

Register it in the configuration by path:

```json name="formbar-schematic.config.json"
{
  "schema": {
    "type": "path/to/content-union.ts#AppContent",
    "emitters": [
      { "use": "./tools/content-overview-emitter.ts", "output": "content-overview.md" }
    ]
  }
}
```

### The Model

`emit` receives a `FormModel`, which is `{ root, nodes }`. `root` is a `TypeRef` that describes the union. `nodes` maps each declared type name to a `FormNode`:

| Name        | Type                                        | Description                                                                                             |
| ----------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| name        | `string`                                    | The declared interface name.                                                                            |
| kind        | `'control' \| 'group' \| 'array' \| 'block'` | Which core base the node extends.                                                                       |
| typeLiteral | `string[] \| null`                          | The narrowed `type` literal or literals. Always an array (a single literal is a one-element list). `null` when `type` is left open. |
| open        | `boolean`                                   | `true` when the node carries an index signature, as blocks do.                                          |
| doc         | `string`                                    | The node's JSDoc, when `docs` is enabled.                                                               |
| properties  | `Property[]`                                | Every property except `type` and the structural child property.                                         |
| children    | `TypeRef`                                   | The child union, for groups and arrays. Absent for controls and blocks.                                 |

Each `Property` is `{ name, optional, doc?, type }`.

`TypeRef` is `{ name, members, constraints?, memberConstraints? }`. `name` is the union alias, or `null` for an inline union. `members` is the list of member names. `constraints` and `memberConstraints` carry TypeScript intersection narrowings, such as an array row's `hideStrategy`. Most emitters can ignore them.

A property's `type` is a `TypeNode`, a discriminated union keyed on `k`:

| k        | Payload                                    |
| -------- | ------------------------------------------ |
| string   | -                                          |
| number   | -                                          |
| boolean  | -                                          |
| null     | -                                          |
| unknown  | -                                          |
| any      | -                                          |
| literal  | `value: string \| number \| boolean`       |
| array    | `items: TypeNode`                          |
| object   | `name?: string`, `properties: Property[]`, `index?: TypeNode` |
| union    | `members: TypeNode[]`                      |
| function | -                                          |
| never    | -                                          |
| ref      | `node: string`                             |
| cycle    | `name: string`                             |

`function` is the predicate arm of `Expression<T>` (see [Expressions](/fundamentals/expressions)). `never` covers types with no JSON value, such as `bigint`. Both project to `null` in `toJsonTypes`.

### The Context

| Name    | Type          | Description                                                                        |
| ------- | ------------- | ---------------------------------------------------------------------------------- |
| tree    | `Tree`        | Write files with `tree.create(path, content)` or `tree.overwrite(path, content)`.  |
| paths   | `EmitPaths`   | `{ workspaceRoot, projectRoot, output }`.                                           |
| options | `EmitOptions` | `{ docs, ...entry.options }`.                                                       |
| logger  | `LoggerApi`   | The schematic logger, e.g. `ctx.logger.info('...')`.                                |

`workspaceRoot` is the real on-disk root, used to resolve package specifiers from `node_modules`. `projectRoot` and `output` are `/`-rooted virtual paths (for example `projects/<project>/src`), not on-disk paths. `output` is `null` when the entry sets no `output`. Fall back to your own default, as the example does with `??`.

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
    const headings = Object.values(model.nodes).map(
      (node) => `## ${node.name}`,
    );
    ctx.tree.create(ctx.paths.output, headings.join('\n') + '\n');
  },
});
```

List `@ngx-formbar/schematics` as a devDependency of the package so the import type-checks. Consumers then use it as described in [Third-Party Emitters](#third-party-emitters).
