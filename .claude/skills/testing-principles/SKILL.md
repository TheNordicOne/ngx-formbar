---
name: testing-principles
description: Black box testing philosophy, semantic selectors, and mocking guidelines. Activate when writing or reviewing any `*.spec.ts` or test file — framework-agnostic rules for unit, component, and integration tests.
license: MIT
---

# Testing Principles

## Black Box Testing

**Test behavior, not implementation.** Assert on what a user sees and does, not on internal state or method calls.

- Test the public API and rendered output — not private methods, internal signals, or class properties
- If you refactor internals without changing behavior, tests should still pass
- **The only acceptable coupling to implementation**: semantic selectors (they test the accessibility contract, which IS the public interface)

## Selector Hierarchy

Use the first selector that expresses intent:

1. **`getByRole(role, { name })`** — default for interactive elements (buttons, links, checkboxes, tabs)
2. **`getByLabelText(label)`** — form controls with labels
3. **`getByPlaceholderText` / `getByDisplayValue`** — forms without labels (flag for a11y review)
4. **`getByText`** — non-interactive content (headings, status text). Prefer `getByRole('heading')` when applicable
5. **`within(container).getBy...`** — scope to a semantic region when multiple exist
6. **`data-testid`** — absolute last resort; must be stable and meaningful

### Forbidden

- **No DOM scans**: `querySelectorAll(...).find(...)` — never scan and filter
- **No deep CSS selectors**: `.a > .b > .c` — tests must not break on layout changes
- **No stylistic class selectors**: `.btn-primary` — unless contractually stable

## Mocking Philosophy

- Mock at **system boundaries** — HTTP, external services, browser APIs
- **Do NOT mock implementation details** — internal services, private methods, signal internals
- Mocks should be minimal and behavior-focused
- Prefer real implementations where practical — they catch more real bugs
- Stub only what you must to isolate the unit under test

## Async Patterns

- `waitFor` / `findBy*` for assertions on async updates
- `vi.useFakeTimers()` for time-dependent behavior

## Test Structure

- One setup helper per spec file — consistent imports, no drift
- Each test should be independent and not depend on execution order
- Test the scenario described in the test name — no more, no less
