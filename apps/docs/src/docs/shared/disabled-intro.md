ngx-formbar disables and enables controls and groups through Angular's form API. You can also access the resolved disabled state and use it in your template.

The disabled state is determined using the following priority (`content` could be any of your controls or groups):
1. If `content.disabled` is a **boolean**, that value is used directly
2. If `content.disabled` is a **string expression**, it's evaluated against the current form values
3. If `content.disabled` is a **function expression**, the function's return value is used
4. If no `disabled` property is defined, the control inherits the disabled state from its parent group

Child controls inherit the disabled state from their parent group unless they set their own value.
