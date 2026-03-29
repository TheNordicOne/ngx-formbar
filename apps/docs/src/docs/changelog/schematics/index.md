## v2.0.0

### Overview

New package containing all code generators, previously part of `@ngx-formbar/core`.

### Added

- **`control` generator:** Scaffolds a new control component and registers it automatically
- **`group` generator:** Scaffolds a new group component and registers it automatically
- **`block` generator:** Scaffolds a new block component and registers it automatically
- **`register` generator:** Discovers all existing components in the project and bulk-registers them

### Migration

No migration steps required. Install as a dev dependency to replace the generators previously in `@ngx-formbar/core`:

```shell
npm install -D @ngx-formbar/schematics
```

Update any scripts using `@ngx-formbar/core:<generator>` to `@ngx-formbar/schematics:<generator>`.
