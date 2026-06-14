### Hide Strategy

Besides visually hiding a control or group, the hidden state can have different effects depending on how the form control should be treated.

This matters when you have a hidden control but still want to access its value through `this.form.value` or `this.form.getRawValue()`.

The following strategies are available:

| Strategy           | Effect                                                                            |
| ------------------ | --------------------------------------------------------------------------------- |
| `keep`             | The form control stays attached to the parent group while the component is hidden |
| `remove` (default) | The form control is removed from the parent group on hide and reattached on show  |

With `hiddenHandling: 'auto'` (the default), the consumer component is destroyed and recreated by the library on every hide/show cycle, regardless of the `hideStrategy`. The strategy only changes whether the form control survives the cycle. With `hiddenHandling: 'manual'`, the component stays mounted at all times and the `hideStrategy` only governs the form control attachment.
