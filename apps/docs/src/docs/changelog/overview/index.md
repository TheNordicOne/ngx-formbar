## v2.0.0

Version 2 splits the monolithic `@ngx-formbar/core` package into four focused packages. The core library no longer depends on `@angular/forms` — all reactive forms functionality now lives in `@ngx-formbar/reactive-forms`.

| Package                       | Breaking Changes | Highlights                                                                                                                                                                                                                                                                       |
|-------------------------------|------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `@ngx-formbar/core`           | Yes              | Removed reactive forms dependency. Component registrations now use `ComponentRegistrationEntry` (static or lazy). Helper functions `staticComponent()` and `loadComponent()` added. Directives, form component, validators, and provider setup moved to `@ngx-formbar/reactive-forms`. |
| `@ngx-formbar/reactive-forms` | -                | New package containing reactive forms directives, components, composables, and validator infrastructure.                                                                                                                                                                         |
| `@ngx-formbar/schematics`     | -                | New package with `control`, `group`, `block`, and `register` generators.                                                                                                                                                                                                         |
| `@ngx-formbar/setup`          | -                | New internal utility package providing AST manipulation and file helpers for schematics.                                                                                                                                                                                         |

For the full step-by-step migration guide, see [**Migrating from v1**](/changelog/migrating-from-v1).

For detailed changes per package, see the individual package changelogs.
