__formbar__ does not mark a control as `readonly`, because there is no useful API for reactive forms to achieve this. But you can provide an expression, which will be evaluated, and then use that value in your template.

The readonly state is determined using the following priority (`content` could be any of your controls or groups):
1. If `content.readonly` is a boolean, that value is used directly
2. If `content.readonly` is an expression string, it's evaluated against the current form values
3. If no `readonly` property is defined, the control inherits the readonly state from its parent group

This hierarchical inheritance ensures that child controls are automatically
set to readonly when their parent group is readonly, unless explicitly overridden.
