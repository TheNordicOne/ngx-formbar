## v2.0.0

Version 2 splits the monolithic `@ngx-formbar/core` package into four focused packages and replaces the directive-based component contract with an interface-based one. The core library no longer depends on `@angular/forms`. All reactive forms functionality now lives in `@ngx-formbar/reactive-forms`.

| Package                       | Breaking Changes | Highlights                                                                                                                                                                                                                                                                                                                                                                                                                                   |
|-------------------------------|------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `@ngx-formbar/core`           | Yes              | Peer dependencies are now `@angular/core` only (`>=20.0.0 <22.0.0`); `@angular/forms` and `@angular/cdk` are no longer required. Component registrations are now `ComponentRegistrationEntry` (static or lazy) via `staticComponent()` and `loadComponent()`, with new options `keepValueWhenHidden` and `disabledHandling`. Directives, form component, validators, and provider setup moved to `@ngx-formbar/reactive-forms`.              |
| `@ngx-formbar/reactive-forms` | Yes              | New interface-based component contract is the headline change for upgraders: components implement `ReactiveFormbarControl<T>`, `ReactiveFormbarGroup<T>`, or `FormbarBlock<T>` and declare `input()` signals. No more `hostDirectives` or `inject(NgxfbControlDirective)`. Group templates render their children with `<ngxfb-control-outlet />`. The package houses all reactive forms directives, components, composables, and validators. |
| `@ngx-formbar/schematics`     | -                | New package. The `control`, `group`, `block`, and `register` generators now scaffold interface-based components.                                                                                                                                                                                                                                                                                                                             |
| `@ngx-formbar/setup`          | -                | New internal utility package providing AST manipulation and file helpers for schematics.                                                                                                                                                                                                                                                                                                                                                     |

### Breaking changes

**`@ngx-formbar/core`:**

- Minimum Angular version bumped from 19 to 20 (`@angular/core >=20.0.0 <22.0.0`).
- `@angular/forms` and `@angular/cdk` are no longer peer dependencies of core.
- Component registrations require the new `ComponentRegistrationEntry` shape (static or lazy) instead of bare `Type<unknown>`.
- Registration option `visibilityHandling` renamed to `keepValueWhenHidden`.
- Type `NgxFbContent` renamed to `NgxFbItem` (the union of `NgxFbFormGroup | NgxFbControl | NgxFbBlock`).
- `NgxfbFormComponent`, `provideFormbar`, `defineFormbarConfig`, validator types and tokens, `ValidatorRegistrationService`, and the directives moved to `@ngx-formbar/reactive-forms`.
- All schematics moved to `@ngx-formbar/schematics`.

**`@ngx-formbar/reactive-forms`:**

- Consumer components no longer use `hostDirectives` or `inject(NgxfbControlDirective)`. They implement `ReactiveFormbarControl<T>`, `ReactiveFormbarGroup<T>`, or `FormbarBlock<T>` and declare `input()` signals.
- Group composition uses `<ngxfb-control-outlet />` in the template; `ngxfbAbstractControl` is gone.
- Hidden lifecycle now destroys and recreates the consumer component when the resolved hidden state changes (with `keepValueWhenHidden: 'auto'`, the default).
- Directive class names `NgxfbControlDirective` and `NgxfbGroupDirective` were renamed with capital `Fb` (`NgxFbControlDirective`, `NgxFbGroupDirective`). `NgxfbBlockDirective` keeps its lowercase form.
- `NgxfbAbstractControlDirective`, the `ngxfbControlHostDirective` / `ngxfbGroupHostDirective` / `ngxfbBlockHostDirective` helpers, and the runtime `setVisibilityHandling()` method were removed.

For the full step-by-step migration guide, see [**Migrating from v1**](/changelog/migrating-from-v1).

In short: four packages instead of one, a cleaner interface-based contract for custom controls and groups, and more registration options. For detailed changes per package, see the individual package changelogs.
