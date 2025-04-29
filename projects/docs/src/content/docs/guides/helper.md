---
title: Helper
keyword: HelperPage
---

To reduce the amount of boilerplate needed with each component and to improve maintainability, you can set up a few helper objects. This way, should anything change, you only need to update one file.

The exact naming of each helper really is up to you.

## Control Container View Providers

`ControlContainer` is required for all controls and groups that will be used within _ngx-formwork_. Injection of the control container allows the components to use reactive forms functionality, without needing to pass the form group through inputs and wrapping the template into additional tags. See this YouTube Video for more detailed explanation: [How to Make Forms in Angular REUSABLE (Advanced, 2023)](https://www.youtube.com/watch?v=o74WSoJxGPI)

```ts title="control-container.view-provider.ts"
export const controlContainerViewProviders = [
  {
    provide: ControlContainer,
    useFactory: () => inject(ControlContainer, { skipSelf: true }),
  },
];
```

```ts title="text-control.component.ts || group.component.ts"
@Component({
  // Other component decorator options
  viewProviders: controlContainerViewProviders,
})
```

## Control Host Directive

This is a convenience helper to apply the `NgxfwControlDirective`.
```ts title="control.host-directive.ts"
export const ngxfwControlHostDirective = {
  directive: NgxfwControlDirective,
  inputs: ['content'],
};
```

Use it like this:
```ts title="text-control.component.ts"
@Component({
  // Other component decorator options
  hostDirectives: [
    // Apply here
    ngxfwControlHostDirective
  ],
})
```

##  Group Host Directive

This is a convenience helper to apply the `NgxfwGroupDirective`.
```ts title="group.host-directive.ts"
export const ngxfwGroupHostDirective = {
  directive: NgxfwGroupDirective,
  inputs: ['content'],
};
```

Use it like this:
```ts title="group.component.ts"
@Component({
  // Other component decorator options
  hostDirectives: [
    // Apply here
    ngxfwGroupHostDirective
  ],
})
```

## Helper Types

For better type safety, when writing a form configuration in TypeScript, _ngx-formwork_ provides a helper type *OneOf*.
With this you can construct a union type like this.

```ts
export type MyAppControls = OneOf<[TestTextControl, TestGroup]>;
```

and use it like this
```ts
export const exampleForm: MyAppControls[] = [ ... ]
```
