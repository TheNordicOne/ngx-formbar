Options are resolved in the following cascading order.

1. Values from `angular.json`
2. CLI Options
3. Values from `formbar-schematic.config.json`

In other words: Values from `formbar-schematic.config.json` overwrite values from the CLI Options, which overwrite values from the `angular.json`.
