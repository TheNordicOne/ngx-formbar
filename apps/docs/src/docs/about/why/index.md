There are already several solid libraries for dynamic, JSON-driven forms. ngx-formbar makes a different set of trade-offs that pay off when configurations have to be storable as JSON, expressions have to stay readable, and components have to fit a specific design system.

## What Are the Key Differences Compared to Other Solutions?

- **JSON-serializable end to end.** Configurations are plain data you can store, send over an API, and load back without a serialization layer in between.
- **JavaScript-like expressions.** String expressions support boolean operators, comparisons, member access, and method calls, evaluated against the form's current value. No nested operator objects.
- **Bring your own components.** No bundled widgets and no UI-library-specific companion packages. Your components stay plain Angular components and remain usable on their own outside the library.
- **Interface contract instead of inheritance.** Components implement a small contract and declare `input()` signals. There is no base class to extend and no host directive to attach.
- **Low-cost adoption and exit.** Existing Angular form components can be adapted to the contract with little code change. You can bring ngx-formbar into an existing project by reusing what you already have, and you can remove it later without rewriting your components.
- **Built on Angular's form primitives.** You read and write values through Angular's own form API, not a library-specific surface.
- **Display-only blocks alongside form controls.** Notes, dividers, headers, and other non-input elements live in the configuration as first-class entries. They are custom Angular components you register, not a fixed set of built-in types, and they participate in the same conditional show/hide system as the controls.
- **Type safety when defining forms in TypeScript.** The contracts are generic over your schema type, so unknown fields surface as compile errors.
- **Built-in test ID generation.** Every control gets a stable selector for end-to-end tests.

The two biggest differentiators are that configurations are pure JSON and that controls are ordinary Angular components. Each control can be as generic or as specialized as the form needs.

## Who Is This For?

ngx-formbar is for projects that need flexibility and control over dynamic forms. It fits especially well when configurations have to be stored or transmitted as JSON, when forms need rich conditional logic, or when the UI has to align with a specific design system.

It is not meant as a replacement for the larger JSON-form libraries. If you want bundled widgets and a ready-to-use UI, those still serve you better. With ngx-formbar you write the form components yourself, so the upfront work is higher in exchange for long-term flexibility.
