Besides visually hiding a control or group, the hidden state can have different effects depending on how this is handled in code.

This is relevant for when you have a hidden control, but still want to access its value through `this.form.value` or `this.form.getRawValue()`.

The following strategies are available:

| Strategy         | Effect                                                 |
|------------------|--------------------------------------------------------|
| `keep` (default) | The control remains in the form model even when hidden |
| `remove`         | The control is removed from the form model when hidden |


:::danger
If you use the `remove` strategy you **must** ensure that your component does not try to render elements with a binding to `[formGroupName]` or `[formControlName]`!

This is true even if you use the `auto` visibility state management! This is currently a limitation, for which I have not found a reasonable solution.

Checkout the [GitHub Issue](https://github.com/TheNordicOne/ngx-formbar/issues/64) for more details.
:::
