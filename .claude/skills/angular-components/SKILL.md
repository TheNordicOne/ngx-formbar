---
name: angular-components
description: Angular v20+ component architecture. Activate when editing `.component.ts`, `.directive.ts`, or Angular inline/external templates — covers standalone components, bindings, control flow, and class structure.
license: MIT
compatibility: Requires Angular 20+ and TypeScript 5+
---

# Angular Components

Rules for Angular v20+ component development. For signals see angular-signals, for services see angular-services.

## Component Architecture

- **Standalone components only** — never use NgModules
- **Do NOT set `standalone: true`** — it's the default in v20+
- `ChangeDetectionStrategy.OnPush` in every `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms over Template-driven
- Keep components small and focused on a single responsibility

## Inputs, Outputs & Queries

- **Use `input()` and `output()` functions** — never `@Input`/`@Output` decorators
- Use `computed()` for derived state from inputs

## Host Bindings

- **DO NOT use `@HostBinding`/`@HostListener`** — put bindings in the `host` object of the decorator
- Use `NgOptimizedImage` for all static images (does not work for inline base64)

## Selectors

- Use the project's configured prefix (kebab-case for components, camelCase for directives)

## Class Member Ordering

1. `inject()` calls
2. Inputs and outputs
3. View/content queries
4. Signals and computed properties
5. Other properties
6. Lifecycle hooks
7. Methods

## Member Visibility

- `protected` — members accessed from the template only
- `private` — internal members not used in the template
- `readonly` — properties initialized by Angular (inputs, queries)

## Bindings

- **DO NOT use `ngClass`** — use `[class.name]` bindings
- **DO NOT use `ngStyle`** — use `[style.prop]` bindings
- **No property binding for static strings** — `mode="pagination"` not `[mode]="'pagination'"`
- Self-closing tags for components and elements without content

## Templates

- **Native control flow only** — `@if`, `@for` (with `track`), `@switch` — never `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe for observables
- No arrow functions in templates (not supported)
- No global access (e.g., `new Date()`) in templates
- Keep templates simple — extract complex logic into component methods

## Event Handlers

- Name handlers for the **action** they perform, not the triggering event
- **Never start handler names with "handle"** — use `saveUser()` or `onSave()`, not `handleClick()`
- Keep lifecycle hooks simple; delegate complex logic to well-named helper methods
