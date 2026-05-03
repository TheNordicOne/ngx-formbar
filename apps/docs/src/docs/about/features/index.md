This page lists what ngx-formbar supports today, what is planned, and what is still under consideration. For the higher-level reasoning behind the design, see [What is ngx-formbar?](/about/what-is) and [Why ngx-formbar?](/about/why).

## Configuration

- Form configurations are plain JSON-serializable data. Store them in a database, send them over an API, or load them from a config file with no custom serialization layer.
- Configurations can also be written in TypeScript. In that mode, expressions can be real typed functions instead of strings.
- The configuration is fully typed against your schema; unknown fields surface as compile errors.
- Each control, group, and block can declare its own custom fields beyond the built-in ones, and they become part of the typed schema.

## Components

- Bring your own components for controls, groups, and display-only blocks. The library ships no bundled widgets and no UI-library-specific companion packages.
- Components implement a small interface contract and declare `input()` signals. There is no base class to extend and no host directive to attach.
- Custom component resolvers cover cases where the standard registration is not enough.

## Component registration

- Each entry is either eager (`staticComponent(MyComponent)`) or lazy (`loadComponent(() => import('...'))`). Both kinds can be mixed freely within the same registration.
- The registration is the central place to configure per-component-type behavior. Options that should apply to every instance of a component (like `hiddenHandling` or `disabledHandling`) live with the registration, not on each form's config.
- Registrations can be added, removed, or swapped at runtime. The registry is signal-backed, so already-mounted forms react to the change without remounting.

## Schematics

- `ng add @ngx-formbar/reactive-forms` configures providers, imports, and the bits of setup most projects need.
- `ng generate @ngx-formbar/schematics:control` (and `:group`, `:block`, `:register`) scaffolds new components against the right interface contract and wires up their registration.

## Conditional state

- Hide, disable, or mark a control as readonly through an expression that evaluates against the form's current value.
- Each can also be set statically or inherited from a parent group.
- Per-control hide strategy: `keep` leaves the form control attached to the parent group while hidden, `remove` detaches it on hide and reattaches it on show.
- Three value strategies for hidden controls: keep the last value, reset, or apply a configured default.

## Dynamic values and labels

- Compute the value of a control from other parts of the form.
- Dynamic labels and titles that update when the form value changes.

## Expressions

- JavaScript-like syntax: boolean operators, comparisons, member access, and method calls.
- Expressions only have access to the form value.
- When the configuration is in TypeScript, expressions can also be real typed functions.

## Validation

- Mark controls as required or attach any validator function.
- Async validators are supported the same way, including ones that depend on other field values.
- Bundle commonly-used validator combinations behind a single key.
- Custom validator resolvers for cross-cutting validation logic.

## Forms

- The form remains a standard Angular form. Read and write values through Angular's own form API; nothing library-specific to learn.
- Configurable update strategy (`change`, `blur`, `submit`) at the form level, with per-control overrides and parent-group inheritance.
- Resetting the form re-evaluates all conditional state, computed values, and dynamic labels in one pass.

## Testing

- Automatic test-id generation per control. The attribute name and the value pattern are configurable, and you can plug in your own builder function for full control over the result.

## Planned features

Committed for future versions, in no particular order.

- Validator registration via DI tokens with cross-referencing, matching the config-based registration path.
- Support for signal-based forms once they stabilise upstream.
- Stricter separation of concerns: form configurations should hold only what is relevant per form (structure, expressions, validators), with all technical behavior configured globally or per component. Partially in place today; some properties still cross the boundary.

## Open feature ideas

Ideas under consideration with no commitment to ship. Feedback is welcome if any of them would unblock work for you.

- An optional self-contained form mode that bundles state management.
- Defining expression functions in TypeScript and referencing them by name from a JSON configuration.
