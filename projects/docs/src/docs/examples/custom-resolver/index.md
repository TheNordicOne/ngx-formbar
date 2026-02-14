

This example demonstrates implementing a custom `ComponentResolver` that can
swap components at runtime — without rebuilding the form.

## How It Works

The default component resolver uses a static `Map<string, Type>`. The
`HybridComponentResolver` extends this by layering a signal-based dynamic
map on top of the default registrations:

```typescript name="hybrid-component-resolver.ts" icon="angular"
@Injectable()
export class HybridComponentResolver implements ComponentResolver {
  private readonly defaultRegistrations = inject(NGX_FW_COMPONENT_REGISTRATIONS);
  private readonly dynamicRegistrations = signal(new Map<string, Type<unknown>>());

  readonly registrations: Signal<ReadonlyMap<string, Type<unknown>>> = computed(() => {
    const result = new Map(this.defaultRegistrations);
    for (const [key, component] of this.dynamicRegistrations()) {
      result.set(key, component);
    }
    return result;
  });

  updateDynamicComponent(key: string, component: Type<unknown>): void {
    const current = new Map(this.dynamicRegistrations());
    current.set(key, component);
    this.dynamicRegistrations.set(current);
  }
}
```

## Provider Setup

The custom resolver is provided at the component level, overriding the default
resolver for this component's subtree:

```typescript name="demo.component.ts" icon="angular"
@Component({
  providers: [
    { provide: NGX_FW_COMPONENT_RESOLVER, useClass: HybridComponentResolver },
    { provide: HybridComponentResolver, useExisting: NGX_FW_COMPONENT_RESOLVER },
  ],
})
export class CustomResolverDemoComponent {
  private readonly componentResolver = inject(HybridComponentResolver);

  setChoiceMode(mode: 'radio' | 'dropdown') {
    this.componentResolver.updateDynamicComponent(
      'radio',
      mode === 'radio' ? RadioControlComponent : DropdownControlComponent,
    );
  }
}
```

The second provider (`useExisting`) ensures the same instance is used whether
injecting by the token or by the class directly.

## Live Demo

Use the buttons to switch the urgency control between radio buttons and a dropdown:

{{ NgDocActions.demo("CustomResolverDemoComponent") }}

## Form Configuration Used

<details>
<summary>maintenance-form.ts (click to expand)</summary>

```typescript file="./../../../app/examples/forms/maintenance-form.ts"
```

</details>
