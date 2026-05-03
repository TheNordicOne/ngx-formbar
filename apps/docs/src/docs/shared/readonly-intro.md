**formbar** does not mark a control as `readonly`, since Angular's form API has no built-in concept for this. Provide an expression and use the resolved value in your template.

The readonly state is determined using the following priority (`content` could be any of your controls or groups):
1. If `content.readonly` is a **boolean**, that value is used directly
2. If `content.readonly` is a **string expression**, it's evaluated against the current form values
3. If `content.readonly` is a **function expression**, the function's return value is used
4. If no `readonly` property is defined, the control inherits the readonly state from its parent group

Child controls inherit the readonly state from their parent group unless they set their own value.
