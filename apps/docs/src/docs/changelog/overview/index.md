## v2.0.0

Version 2 splits the monolithic `@ngx-formbar/core` package into four focused packages and replaces the directive-based component contract with an interface-based one. Core no longer depends on `@angular/forms`; all reactive forms functionality now lives in `@ngx-formbar/reactive-forms`.

| Package                       | Breaking Changes | Highlights                                                                                                                                                                                                                                  |
|-------------------------------|------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `@ngx-formbar/core`           | Yes              | Peers are now `@angular/core` (`>=20.0.0 <22.0.0`) and `rxjs` (`>=7.0.0`); `@angular/forms` and `@angular/cdk` dropped. Registrations use `ComponentRegistrationEntry` via `staticComponent()` / `loadComponent()`, with `hiddenHandling` and `disabledHandling`. Directives, form component, validators, and provider setup moved to `@ngx-formbar/reactive-forms`. |
| `@ngx-formbar/reactive-forms` | Yes              | New interface-based component contract: implement `ReactiveFormbarControl<T>`, `ReactiveFormbarGroup<T>`, or `FormbarBlock<T>` with `input()` signals. Groups render children with `<ngxfb-control-outlet />`. New: form arrays backed by a native `FormArray`. |
| `@ngx-formbar/schematics`     | -                | New package. The `control`, `group`, `block`, and `register` generators now scaffold interface-based components. |
| `@ngx-formbar/setup`          | -                | New internal utility package providing AST manipulation and file helpers for schematics. |

### Breaking changes

**`@ngx-formbar/core`:**

- Minimum Angular version bumped from 19 to 20 (`@angular/core >=20.0.0 <22.0.0`).
- `@angular/forms` and `@angular/cdk` are no longer peer dependencies.
- Component registrations require the new `ComponentRegistrationEntry` shape instead of bare `Type<unknown>`.
- Registration option `visibilityHandling` renamed to `hiddenHandling`.
- Type `NgxFbContent` renamed to `NgxFbItem` (`NgxFbFormGroup | NgxFbControl | NgxFbArray | NgxFbBlock`).
- `NgxFbFormComponent`, `provideFormbar`, `defineFormbarConfig`, validator types and tokens, `ValidatorRegistrationService`, and the directives moved to `@ngx-formbar/reactive-forms`.
- All schematics moved to `@ngx-formbar/schematics`.

**`@ngx-formbar/reactive-forms`:**

- Consumer components implement `ReactiveFormbarControl<T>`, `ReactiveFormbarGroup<T>`, or `FormbarBlock<T>` with `input()` signals instead of using `hostDirectives` or `inject(NgxfbControlDirective)`.
- Group composition uses `<ngxfb-control-outlet />`; `ngxfbAbstractControl` is gone.
- Hidden lifecycle destroys and recreates the consumer component when the resolved hidden state changes (with `hiddenHandling: 'auto'`, the default).
- Directive class names now use a consistent capital `Fb`: `NgxFbControlDirective`, `NgxFbGroupDirective`, `NgxFbBlockDirective`.
- `NgxfbAbstractControlDirective`, the `ngxfbControlHostDirective` / `ngxfbGroupHostDirective` / `ngxfbBlockHostDirective` helpers, and the `setVisibilityHandling()` method were removed.

For the full step-by-step migration guide, see [Migrating from v1](/changelog/migrating-from-v1). For detailed changes per package, see the individual package changelogs.
