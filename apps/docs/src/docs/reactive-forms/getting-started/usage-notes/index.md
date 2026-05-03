A few things to know about when using _ngx-formbar_.

- The `readonly` property only provides the (dynamic) value. Your component decides how to apply it.
- Sometimes when writing a form configuration, TypeScript throws errors about properties not being compatible. If that happens, double check the property names.
  - For example: a group has a `title` property, and a control has a `label`. Adding a `label` property to a group confuses TypeScript, which then reports errors about unrelated properties not matching.
