__formwork__ will use Angulars reactive forms API to disable and enable a control or group. You can get access to the disabled state and use it in your template for whatever makes sense.

The disabled state is determined using the following priority (`content` could be any of your controls or groups):
1. If `content.disabled` is a boolean, that value is used directly
2. If `content.disabled` is an expression string, it's evaluated against the current form values
3. If no `disabled` property is defined, the control inherits the disabled state from its parent group

This hierarchical inheritance ensures that child controls are automatically
disabled when their parent group is disabled, unless explicitly overridden.
