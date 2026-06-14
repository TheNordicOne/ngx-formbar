## v2.0.0

### Overview

New internal utility package providing shared helpers for schematics. It is a dependency of `@ngx-formbar/schematics` and the `@ngx-formbar/reactive-forms` ng-add schematic, and is installed automatically.

### Added

- TypeScript AST parsing and manipulation utilities.
- Import statement detection and validation.
- Decorator inspection helpers (Component, hostDirectives).
- Component registration node discovery and updates.
- File and workspace operation helpers.
- Configuration type definitions: `NgxFormbarAutomationConfig`, `BaseGenerateSchematicConfig`, `DiscoveryConfig`.

### Migration

No migration steps required. Update the package version to upgrade.
