The `schema` generator produces documents from your [content union](/fundamentals/configuration#type-generic). The two built-in emitters write JSON Schema. You can write your own emitter to produce any other output.

## Configuration

The `schema` section of `formbar-schematic.config.json` configures the generator. `ng add` normally creates it. If yours has no such section, add it:

```json name="formbar-schematic.config.json"
{
  "schema": {
    "type": "app/types/content.type.ts#AppContent",
    "emitters": [{ "use": "json-schema-2020-12", "output": "form.schema.json" }]
  }
}
```

| Key      | Type   | Required | Description                                                                                             |
| -------- | ------ | -------- | ------------------------------------------------------------------------------------------------------- |
| type     | string | Yes      | The content union as file and export, like `app/types/content.type.ts#AppContent`. See [Paths](#paths). |
| emitters | array  | No       | Emitter entries to run, in order. Without entries, the generator writes nothing.                        |

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

The generator reads your project's TypeScript configuration, so path aliases in your content union work.

### Options

| Option             | Type   | Required | Default                   | Description                                                                                                                      |
| ------------------ | ------ | -------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| --project          | string | No       | workspace default project | Angular project name where files are generated.                                                                                  |
| --schematicsConfig | string | No       | -                         | The schematics configuration file to use. See [Finding the Schematics Configuration](#finding-the-schematics-configuration).     |
| --type             | string | No       | -                         | The content union as file and export, like `app/types/content.type.ts#AppContent`. Overrides `schema.type`. See [Paths](#paths). |
| --emitter          | array  | No       | -                         | Run only the configured emitter entries whose `use` matches one of these values. Repeat to select more than one.                 |
| --output           | string | No       | -                         | Overrides the `output` of one emitter entry (see [Paths](#paths)). With several entries, select one with `--emitter`.            |

## Paths

{% include "../../shared/paths.md" %}

A local `use` path must start with `./`, `../` or `/`. Anything else is read as a built-in name or a package name. With source root `src`, `./tools/my-emitter.ts` is `src/tools/my-emitter.ts`.

## Finding the Schematics Configuration

{% include "../../shared/config-discovery.md" %}

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

The generated schema checks that every entry in a form's `content` matches a member of your content union, including its `type`.

To validate a form config in your editor, reference the generated file with `$schema`. The path is relative to the form file:

```json name="src/form.json"
{ "$schema": "./form.schema.json", "content": {} }
```

## Third-Party Emitters

To use an emitter someone else published, point `use` at the package name:

```json name="formbar-schematic.config.json"
{
  "schema": {
    "type": "app/types/content.type.ts#AppContent",
    "emitters": [{ "use": "@acme/formbar-markdown-emitter" }]
  }
}
```

This uses the package's default export. To use a named export, add its name after `#`, like `@acme/formbar-markdown-emitter#tableEmitter`.

## Custom Emitters

Skip this section if the built-in JSON Schema output is all you need. It describes the contract for writing your own emitter.

### A Minimal Emitter

An emitter is the module's default export: an object with a string `name` and an `emit(model, ctx)` method. Any object of that shape loads. `defineEmitter` returns the object unchanged and types `model` and `ctx`.

Save the emitter in your project. This one writes a Markdown reference of every node and its properties:

```typescript name="src/tools/content-overview-emitter.ts"
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
    "type": "app/types/content.type.ts#AppContent",
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

`ctx.paths` holds three values:

| Key             | Description                                                                                                                      | Example                               |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `workspaceRoot` | The workspace's absolute path on disk. Use it to resolve packages from `node_modules`.                                           | `/home/me/my-workspace`               |
| `projectRoot`   | The project's source root, or its root when it has none. Relative to the workspace, with no leading `/`.                         | `projects/shop/src`                   |
| `output`        | The file to write, as a `/`-rooted path in `ctx.tree`. `null` when the entry sets no `output`, so fall back to your own default. | `/projects/shop/src/form.schema.json` |

`toJsonTypes(type)` projects a `TypeNode` onto its JSON part, dropping `function` arms and collapsing one-arm unions. It returns `null` when no JSON value satisfies the type. Use it when producing JSON-shaped output.

> **Note**
> Emitters run inside the schematic transaction. A throw aborts the whole run and nothing is written, not this emitter's output, not the earlier emitters'. `--dry-run` covers only writes through `ctx.tree`.

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
