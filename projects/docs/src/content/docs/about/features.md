---
title: Features
keyword: FeaturePage
sidebar:
  order: 2
---

- All form configurations are fully compatible with JSON
  - Configurations can easily be stored in a database
- Create your own form controls
  - No extra packages for rendering with UI Library X or CSS Framework Y
  - Controls are fully typed
  - Add whatever options you need for your controls
- Schematic for adding formbar and scaffolding new controls
- Full ownership of the form
- Hide controls based on an expression and the form state
  - Decide how the value of hidden controls behave (keep last, reset, default)
- Disable controls based on an expression and the form state or set it statically
- Compute a controls readonly based on an expression and the form state or set it statically
- Mark a control as required or add other validators
- Combine commonly used validator combinations into a single key
- Expression syntax is like JavaScript
  - Expressions only run against the form value
- Support for non-control blocks (pure informational components like a callout, paragraphs, etc.)
- Derive a value based on form state (dynamic readonly controls)
- Dynamic labels/titles based on form state
- Use own component and validator resolvers if you need more involved logic
- Switch, add or remove registrations during runtime
- Automatic e2e-Id generation
- Configuration of test id (attribute name and how value is build)
- Support for full TypeScript-only configurations, meaning you can use actual functions for the expressions


### Planned Features and Improvements

The following are features and improvements that are planned for future versions.

- Registering validators via DI tokens supports cross-referencing analog to registration via config
- Support for Signal Based Form (work will beginn once they are stable)

### Open Feature Ideas

The following are some ideas that are interesting. There is no guarantee that they will be implemented. Let me know if you feel like one of those ideas can be very useful.

- UI for creating valid configurations in JSON
- Optionally allow a form to be handled entirely self-contained
- Allow defining expression functions in TS but reference them by name

