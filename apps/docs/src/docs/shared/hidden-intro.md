By default, the visibility is handled by **formbar**. Depending on the `hideStrategy`, the library handles visibility differently:

- **`keep`** (default): The `hidden` attribute is set on your component, visually hiding it while keeping it in the DOM and form model.
- **`remove`**: The component is structurally removed from the DOM and unregistered from the form model. When shown again, the component is recreated and its value is restored based on the `valueStrategy`.

You have the option to handle visibility yourself by setting `visibilityHandling: 'manual'` in the component registration. This disables all automatic visibility behavior. It can be useful for when you want to show some placeholder instead or need fine-grained control over the visibility behavior.

### Visibility State Overview

| Visibility Handling | Hide Strategy    | When hidden                                                   | Value on re-show                                                   |
|---------------------|------------------|---------------------------------------------------------------|--------------------------------------------------------------------|
| `auto` (default)    | `keep` (default) | `hidden` attribute set on host, control stays in form model   | Determined by `valueStrategy` (applied while hidden)               |
| `auto`              | `remove`         | Component destroyed and removed from form model               | Determined by `valueStrategy` (restored from cache on re-creation) |
| `manual`            | `keep`           | No automatic behavior — component manages visibility itself   | Value unchanged (library does not intervene)                       |
| `manual`            | `remove`         | No automatic behavior — component manages visibility itself   | Value unchanged (library does not intervene)                       |

> **Note**
> When using `manual` visibility handling, the library only handles initial control registration. It does not set the `hidden` attribute, apply value strategies, or structurally remove the component. The component receives the `isHidden` signal and is responsible for managing its own visibility.

### Hidden State Rules

The hidden state is determined using the following rules (`content` could be any of your controls or groups):
1. If no `hidden` expression is defined, the control inherits the hidden state from its parent group
2. If `content.hidden` is a **string expression**, it's evaluated against the current form values and combined with the parent's hidden state — a control is hidden if either its own condition evaluates to true **OR** its parent group is hidden
3. If `content.hidden` is a **function expression**, only the function's return value is used — the parent's hidden state is **not** combined
