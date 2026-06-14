A few things to know about when using ngx-formbar.

- The `readonly` property only provides the (dynamic) value. Your component decides how to apply it.
- When writing a form configuration, TypeScript sometimes throws errors about properties not being compatible. If that happens, double check the property names.
  - For example: a group has a `title` property, and a control has a `label`. Adding a `label` property to a group confuses TypeScript, which then reports errors about unrelated properties not matching.
