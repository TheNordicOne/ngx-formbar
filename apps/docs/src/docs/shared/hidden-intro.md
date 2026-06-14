By default the visibility lifecycle is handled by ngx-formbar. With `hiddenHandling: 'auto'` (the default registration option), the library destroys the consumer component when the resolved hidden state becomes `true` and recreates it when the state becomes `false` again. The `hideStrategy` controls what happens to the underlying form control during that cycle:

- **`keep`** (default): the form control stays attached to the parent group while the component is hidden, so the value remains part of `form.value`. The configured `valueStrategy` is applied to that existing form control.
- **`remove`**: the form control is removed from the parent group on hide and reattached on show. On reattach, the value is determined by the `valueStrategy` (with `'last'` restored from the form-level lifecycle cache).

You can opt out of all of this by setting `hiddenHandling: 'manual'` in the registration. The component then stays mounted at all times and is responsible for reading the `isHidden` signal and rendering accordingly. The library still resolves and supplies the signal but applies no value strategy and never tears down the component.

### Visibility State Overview

| `hiddenHandling` | `hideStrategy`   | When hidden                                                       | Value on re-show                                                   |
|-----------------------|------------------|-------------------------------------------------------------------|--------------------------------------------------------------------|
| `auto` (default)      | `keep` (default) | Component destroyed; form control stays attached                  | Determined by `valueStrategy` (applied to existing control)        |
| `auto`                | `remove`         | Component destroyed; form control removed from the parent group   | Determined by `valueStrategy` (restored from cache on re-creation) |
| `manual`              | `keep`           | No automatic behavior; component manages visibility itself        | Value unchanged (library does not intervene)                       |
| `manual`              | `remove`         | No automatic behavior; form control still removed and reattached  | Determined by `valueStrategy` (restored from cache on re-creation) |

> **Note**
> When `hiddenHandling` is `'manual'`, the library does not destroy or recreate the component on visibility changes and does not apply value strategies. The component receives the `isHidden` signal and is responsible for managing its own visibility.

### Hidden State Rules

The hidden state is determined using the following rules (`content` could be any of your controls or groups):
1. If no `hidden` expression is defined, the control inherits the hidden state from its parent group
2. If `content.hidden` is a **string expression**, it's evaluated against the current form values and combined with the parent's hidden state. A control is hidden if either its own condition evaluates to `true` **or** its parent group is hidden
3. If `content.hidden` is a **function expression**, the function's return value is combined with the parent's hidden state the same way
