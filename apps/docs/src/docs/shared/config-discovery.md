`ng add` normally creates the schematics configuration file. The schematics use the first of these that applies:

| Step | Where                                                         | Example                                 |
| ---- | ------------------------------------------------------------- | --------------------------------------- |
| 1    | `--schematicsConfig`, or `schematicsConfig` in `angular.json` | `forms/formbar-schematic.config.json`   |
| 2    | The `app` folder in the source root                           | `src/app/formbar-schematic.config.json` |
| 3    | The workspace root                                            | `formbar-schematic.config.json`         |

The file at the workspace root is the default for every project without its own. Its settings are not merged with a project's own file.

Each schematic logs which file it used. A file named in step 1 has to exist. Its path follows [Paths](#paths).
