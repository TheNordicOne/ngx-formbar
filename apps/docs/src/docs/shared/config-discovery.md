`ng add` normally creates the schematics configuration file. The file at the workspace root applies to every project. A project's own file goes on top of it and only needs what differs. The first of steps 1 and 2 that applies is that own file:

| Step | Where                                                                                                                             | Example                                 |
| ---- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| 1    | `--schematics-config`, or `schematicsConfig` in `angular.json`, set per generator such as under `@ngx-formbar/schematics:control` | `forms/formbar-schematic.config.json`   |
| 2    | The `app` folder in the source root                                                                                               | `src/app/formbar-schematic.config.json` |
| 3    | The workspace root                                                                                                                | `formbar-schematic.config.json`         |

```json name="formbar-schematic.config.json"
{
  "registrationType": "config",
  "viewProviderHelperPath": "app/shared/helper",
  "control": { "interfaceSuffix": "Config", "componentSuffix": "Input" }
}
```

```json name="projects/admin/src/app/formbar-schematic.config.json"
{
  "registrationType": "token",
  "viewProviderHelperPath": null,
  "control": { "componentSuffix": "Field" }
}
```

Project `admin` registers by token, uses no view provider helper, and its controls get the suffixes `Config` and `Field`. Objects merge per key, `null` removes a setting, and anything else, including an array like `include`, replaces the value from the workspace root.

Each schematic logs which files it used. A file named in step 1 has to exist. Its path follows [Paths](#paths).
