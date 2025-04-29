By default, the visibility is handled by __formwork__. It will set the `hidden` attribute on your component, if a control or group should not be visible.

You have the option to handle this by yourself, but can only be configured on a component level.
It can be useful for when you want to work with `@if` to actually create and destroy components used in the template, or you want to show some placeholder instead.

The hidden state is determined using the following priority (`content` could be any of your controls or groups):
1. If `content.hidden` is an expression string, it's evaluated against the current form values
2. If no `hidden` expression is defined, the control inherits the hidden state from its parent group
3. Both conditions can be combined - a control is hidden if either its own condition evaluates to true **OR** its parent group is hidden

