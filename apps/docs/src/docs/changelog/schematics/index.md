## v2.0.0

### Overview

New package containing all code generators, previously part of `@ngx-formbar/core`. Generators now scaffold interface-based components aligned with the `@ngx-formbar/reactive-forms` v2 architecture. See [Generators](/fundamentals/generators).

### Added

- `control` generator: scaffolds a control component implementing `ReactiveFormbarControl<T>`, with signal `input()` bindings, and registers itself automatically.
- `group` generator: scaffolds a group component implementing `ReactiveFormbarGroup<T>` using `<ngxfb-control-outlet />`, and registers itself automatically.
- `block` generator: scaffolds a block component implementing `FormbarBlock<T>`, and registers itself automatically.
- `register` generator: discovers existing components and bulk-registers them as `ComponentRegistrationEntry` values.

### Changed

- Generated control, group, and block components now implement the corresponding `@ngx-formbar/reactive-forms` interface and expose inputs as signals.
- Group templates render children through `<ngxfb-control-outlet />`.
- Generated registrations use `ComponentRegistrationEntry` from `@ngx-formbar/core` (`staticComponent()` / `loadComponent()`).

### Removed

- `--hostDirectiveHelperPath` CLI option from the `control`, `group`, and `block` generators. The `--viewProviderHelperPath` option still applies to `control` and `group`.
- Generated components no longer reference `hostDirectives` or `inject(NgxfbControlDirective)`.

### Migration

Install as a dev dependency to replace the generators previously in `@ngx-formbar/core`:

```shell
npm install -D @ngx-formbar/schematics
```

Update any scripts using `@ngx-formbar/core:<generator>` to `@ngx-formbar/schematics:<generator>`, and drop the `--hostDirectiveHelperPath` flag. Existing v1-generated components continue to work; see [Migrating from v1](/changelog/migrating-from-v1) to convert them.
