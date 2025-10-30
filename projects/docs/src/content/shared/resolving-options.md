Due to the current implementation and how the default values are set, the options are resolved in the following cascading order.

1. Values from `angular.json`
2. CLI Options
3. Values from `formbar.config.json`

In other words: Values from `formbar.config.json` overwrite values from the CLI Options, which overwrite values from the `angular.json`.
