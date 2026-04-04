### Hide Strategy

Besides visually hiding a control or group, the hidden state can have different effects depending on how this is handled in code.

This is relevant for when you have a hidden control, but still want to access its value through `this.form.value` or `this.form.getRawValue()`.

The following strategies are available:

| Strategy         | Effect                                                                    |
|------------------|---------------------------------------------------------------------------|
| `keep` (default) | The control remains in the form model even when hidden                    |
| `remove`         | The control is removed from the form model and destroyed when hidden      |

When using the `remove` strategy, the component is structurally removed from the DOM when hidden and recreated when shown again. The value restoration behavior on re-show is determined by the `valueStrategy` option.
