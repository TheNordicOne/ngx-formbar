---
title: Usage Notes
keyword: UsageNotesPage
---

A few things to know about when using _ngx-formwork_

- The `readonly` property itself only provides you with the (dynamic) value. How and if this is handled has to be implemented in the component
- Sometimes when writing a form configuration, TS will throw errors about properties not being compatible. If that happens double check precisely the property names.
  - For example: A group can have a title property and a control a label. Adding a label property to a group will confuse TypeScript and it throws Errors about unrelated properties not matching.
- In some cases, when configuring a group in TS, it helps to cast the controls property like so `controls: <NgxFwContent[]>[...]` or `controls: <MyAppControls[]>[...]` if you use the `OneOf` type helper

