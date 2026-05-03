To reduce the amount of boilerplate needed with each component and to improve maintainability, you can set up a few helper objects. This way, should anything change, you only need to update one file.


### Manual Helper File Integration

You can place the helper files in any folder in your project. If you put them in the default location (`app/shared/helper`), they can be discovered automatically.

Otherwise, run schematics with the `--viewProviderHelperPath` flag to point to your file or configure it as a default. The configuration for each schematic is described on the schematics pages Generators and Register.


### Control Container View Providers

`ControlContainer` is required for all controls and groups that will be used within _ngx-formbar_. Injection of the control container allows the components to use reactive forms functionality, without needing to pass the form group through inputs and wrapping the template into additional tags. See this YouTube Video for more detailed explanation: [How to Make Forms in Angular REUSABLE (Advanced, 2023)](https://www.youtube.com/watch?v=o74WSoJxGPI)

```typescript group="view-provider" name="control-container.view-provider.ts"
export const controlContainerViewProviders = [
  {
    provide: ControlContainer,
    useFactory: () => inject(ControlContainer, { skipSelf: true }),
  },
];
```

```typescript group="view-provider" name="Usage in component" icon="angular"
@Component({
  // Other component decorator options
  viewProviders: controlContainerViewProviders,
})
```

> **Note:** Earlier versions of _ngx-formbar_ shipped additional helpers (`ngxfbControlHostDirective`, `ngxfbGroupHostDirective`, `ngxfbBlockHostDirective`) for applying host directives to consumer components. As of v2.0.0, components implement the interface contract directly, so those host-directive helpers are no longer needed and have been removed.


### Union Types

For official documentation of Union Types checkout the [official docs](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types).

Setting up a union type for your own controls is highly recommended, as it gives you much better type safety, when writing your forms in TypeScript.

```typescript name="app-controls.type.ts"
export type MyAppControls = TestTextControl | TestGroup | InfoBlock;
```
