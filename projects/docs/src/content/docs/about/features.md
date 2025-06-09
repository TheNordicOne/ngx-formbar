---
title: Features
keyword: FeaturePage
---


## Overview

- [x] All form configurations are fully compatible with JSON
  - [x] Configurations can easily be stored in a database
- [x] Create your own form controls
  - [x] No extra packages for rendering with UI Library X or CSS Framework Y
  - [x] Controls are fully typed
  - [x] Add whatever options you need for your controls
- [x] Automatic e2e-Id generation
- [x] Hide controls based on an expression and the form state
  - [x] Decide how the value of hidden controls behave (keep last, reset, default)
- [x] Disable controls based on an expression and the form state or set it statically
- [x] Compute a controls readonly based on an expression and the form state or set it statically
- [x] Mark a control as required or add other validators
- [x] Combine commonly used validator combinations into a single key
- [x] Expression syntax is like JavaScript
  - [x] Expressions only run against the form value
- [x] Support for non-control blocks (pure informational components like a callout, paragraphs, etc.)
- [x] Derive a value based on form state (dynamic readonly controls)
- [x] Dynamic labels/titles based on form state
- [x] Configuration of test id (attribute name and how value is build)
- [x] Support for full TypeScript-only configurations, meaning you can use actual functions for the expressions
- [ ] Schematic for adding formwork and scaffolding new controls


### Open Feature Ideas

The following are some ideas that are interesting. There is no guarantee that they will be implemented. Let me know if you feel like one of those ideas can be very useful.

- UI for creating valid configurations in JSON
- Optionally allow a form to be handled entirely self-contained
- Allow defining expression functions in TS but reference them by name
