---
name: angular-component-tests
description: Angular component test patterns. Activate when writing or reviewing `*.spec.ts` files for Angular components — covers test host pattern, Angular Testing Library, userEvent, and CDK harnesses for overlays.
license: MIT
compatibility: Requires Vitest, @testing-library/angular, @angular/cdk
---

# Angular Component Tests

Angular-specific patterns built on the testing-principles skill. Use Angular Testing Library (ATL) with the test host pattern.

## Setup

In your Vitest setup file:

```ts
import '@testing-library/jest-dom/vitest';
```

## Test Host Pattern

**Always render the CUT via a host template.** Never use `TestBed.createComponent(CUT)` directly.

```ts
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

it('emits when clicked', async () => {
  const user = userEvent.setup();
  const onSelected = vi.fn();

  await render(
    `<dashboard-hero [hero]="hero" (selected)="onSelected($event)" />`,
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

## Input Changes

Mutate host properties via the fixture instance, then call `detectChanges()`:

```ts
r.fixture.componentInstance.hero = { id: 2, name: 'Sarah Kerrigan' };
r.fixture.detectChanges();

await waitFor(() => {
  expect(screen.getByRole('button', { name: /sarah kerrigan/i })).toBeInTheDocument();
});
```

Use `waitFor` / `findBy*` when the update may be async. Use `await fixture.whenStable()` for Angular async operations.

## Interactions

- **`userEvent`** for all user interactions — not `fireEvent`
- `fireEvent` only as escape hatch for edge cases

## CDK Harnesses (Escape Hatch)

Use only for **overlays and complex widgets** (dialogs, menus, autocomplete, tooltips):

```ts
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialogHarness } from '@angular/material/dialog/testing';

const rootLoader = TestbedHarnessEnvironment.documentRootLoader(r.fixture);
const dialogs = await rootLoader.getAllHarnesses(MatDialogHarness);
```

- `documentRootLoader` — for overlays appended to `document.body`
- `loader` — for content inside the fixture root
