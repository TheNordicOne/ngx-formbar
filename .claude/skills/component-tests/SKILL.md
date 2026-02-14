---
name: component-tests
description: Angular component testing patterns using test hosts, Angular Testing Library, and semantic selectors. Use when writing, reviewing, or fixing component test files (*.spec.ts).
license: MIT
compatibility: Requires Vitest, @testing-library/angular, and @angular/cdk
---
# Component Testing with Test Host Pattern

## Objective

Standardize Angular component tests around **one predictable setup**:

* Always test the component under test (CUT) **as consumed by a parent** (a *test host*).
* Prefer **semantic selectors** (accessibility-driven) over DOM-shape selectors.
* Use **Angular Testing Library (ATL)** for rendering, querying, and interaction.
* Use **Angular CDK Harnesses** as the single sanctioned escape hatch for complex widgets/overlays.

This skill replaces ad hoc patterns such as:

* querying many nodes then filtering by `textContent`
* deep CSS selectors tied to layout/styling

---

## Non‑Negotiables

1. **Always use a Test Host**
* Tests must render a host template that binds the CUT inputs and handles the CUT outputs.
* Do not instantiate the CUT directly via `TestBed.createComponent(CUT)`.

2. **Prefer semantic selectors**
* Default selector: **role + accessible name**.
* Never “scan and filter” the DOM (e.g., `querySelectorAll(...).find(...)`).

3. **One setup per spec file**
* Tests should share a single helper and consistent imports.

---

## Canonical Tooling

### Primary

* **Angular Testing Library**: `render`, `screen`, `within`, `waitFor`
* **Testing Library user-event**: `userEvent.setup()` for interactions

### Secondary (escape hatch)

* **Angular CDK Testing Harnesses**: for widgets and overlays where DOM is inherently unstable

---

## Standard Pattern

### Use a host template for every test

Render a host template string and bind inputs/outputs through `componentProperties`.

```ts
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

it('wires inputs and outputs through the host', async () => {
  const user = userEvent.setup();
  const onSelected = vi.fn();

  await render(
    `<dashboard-hero
      [hero]="hero"
      (selected)="onSelected($event)"
    />`,
    {
      imports: [DashboardHero],
      componentProperties: {
        hero: { id: 42, name: 'Alyx Vance' },
        onSelected,
      },
    },
  );

  await user.click(screen.getByRole('button', { name: /alyx vance/i }));
  expect(onSelected).toHaveBeenCalledWith({ id: 42, name: 'Alyx Vance' });
});
```

**Notes**

* The template is the test host. Keep it minimal and scenario-focused.
* Output handlers live on `componentProperties`.

---

## Selector Policy (Semantic-First)

### Required hierarchy

Use the first selector that expresses the intent.

1. **`getByRole(role, { name })`** (default for interactive elements)

* Buttons, links, checkboxes, radios, tabs, menuitems, etc.

2. **`getByLabelText(label)`** (forms)

* Inputs/selects/textarea associated with `<label>` or `aria-label`/`aria-labelledby`.

3. **`getByPlaceholderText` / `getByDisplayValue`** (forms, when labels are not available)

* Acceptable but should trigger a UX/accessibility review if used frequently.

4. **`getByText`** (non-interactive content)

* Headings, status text, empty states. Prefer roles if applicable (e.g., `heading`).

5. **`within(container).getBy...`** (scoped queries)

* When multiple regions exist, scope queries to a semantic container.

### Forbidden patterns

Do not use:

```ts
Array.from(root.querySelectorAll('button')).find(...)
```

Avoid deep CSS selectors (`.a > .b > .c`) unless there is no semantic alternative.

### When a test hook is acceptable

If the UI has no stable semantic surface (rare), use `data-testid`.

* Must be a **last resort**.
* Must be stable and meaningful.

---

## Inputs Testing (Host → CUT)

### Update host state and assert UI

```ts
import { render, screen } from '@testing-library/angular';
import { waitFor } from '@testing-library/dom';

it('updates when host input changes', async () => {
  const r = await render(
    `<dashboard-hero [hero]="hero" (selected)="noop($event)" />`,
    {
      imports: [DashboardHero],
      componentProperties: {
        hero: { id: 1, name: 'Gordon Freeman' },
        noop() {},
      },
    },
  );

  expect(screen.getByRole('button', { name: /gordon freeman/i })).toBeInTheDocument();

  r.fixture.componentInstance.hero = { id: 2, name: 'Sarah Kerrigan' };
  r.fixture.detectChanges();

  await waitFor(() => {
    expect(screen.getByRole('button', { name: /sarah kerrigan/i })).toBeInTheDocument();
  });
});
```

**Rule of thumb**

* If you mutate host properties via the fixture instance, call `detectChanges()`.
* Use `waitFor`/`findBy*` when the update may be async.

---

## Outputs Testing (CUT → Host)

Prefer verifying the host handler invocation.

```ts
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

it('emits selected to the host handler', async () => {
  const user = userEvent.setup();
  const onSelected = vi.fn();

  await render(
    `<dashboard-hero [hero]="hero" (selected)="onSelected($event)" />`,
    {
      imports: [DashboardHero],
      componentProperties: {
        hero: { id: 9, name: 'Regina Mills' },
        onSelected,
      },
    },
  );

  await user.click(screen.getByRole('button', { name: /regina mills/i }));
  expect(onSelected).toHaveBeenCalledTimes(1);
  expect(onSelected).toHaveBeenCalledWith({ id: 9, name: 'Regina Mills' });
});
```

---

## Interaction Policy

* Prefer `userEvent` for user-realistic interactions (click, type, tab).
* Use `fireEvent` only when `userEvent` is impractical (edge cases).

---

## CDK Harness Policy (Escape Hatch)

Use harnesses when:

* The component uses **Overlay** (menus, dialogs, tooltips, autocomplete).
* DOM structure is volatile and not meant to be asserted against.
* You need robust interaction APIs.

### Harness usage with a rendered fixture

```ts
import { render } from '@testing-library/angular';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialogHarness } from '@angular/material/dialog/testing';

it('opens a dialog (harness)', async () => {
  const r = await render(`<app-host />`, { imports: [HostComponent] });

  const rootLoader = TestbedHarnessEnvironment.documentRootLoader(r.fixture);
  const dialogs = await rootLoader.getAllHarnesses(MatDialogHarness);

  expect(dialogs.length).toBeGreaterThan(0);
});
```

**Rule**

* Prefer `documentRootLoader` for overlays appended to `document.body`.
* Prefer `loader` for content inside the fixture root.

---

## Consistency Helpers (Recommended)

Create a small internal helper module so tests do not drift.

### `test-ui.ts`

```ts
import { screen, within } from '@testing-library/angular';

type ContainerLike = HTMLElement | Document;

export function ui(container?: ContainerLike) {
  if (!container) {
    return screen;
  }

  return within(container as HTMLElement);
}
```

Use `screen` by default; use `ui(regionEl)` when scoping.

---

## Vitest Setup Requirements

In your Vitest setup file (executed once), enable Testing Library matchers:

```ts
import '@testing-library/jest-dom/vitest';
```

---

## Definition of Done (PR checklist)

A component test meets this skill when it:

* Renders a **host template** that binds inputs and handles outputs
* Uses **semantic selectors** (`getByRole` / `getByLabelText`) as the default
* Avoids DOM scans and manual `textContent` filtering
* Uses **`userEvent`** for interactions
* Uses **CDK harnesses** only for overlays/complex widgets
* Contains no deep CSS selectors unless justified

---

## Appendix: Examples of Good Selectors

* `screen.getByRole('button', { name: /save/i })`
* `screen.getByRole('textbox', { name: /email/i })`
* `screen.getByLabelText(/password/i)`
* `within(screen.getByRole('dialog')).getByRole('button', { name: /close/i })`

## Appendix: Examples of Bad Selectors

* `querySelectorAll('button')` + `.find(btn => btn.textContent === ...)`
* `.container > :nth-child(2) .btn.primary`
* selecting by purely stylistic classes (`.btn-primary`) unless they are contractually stable
