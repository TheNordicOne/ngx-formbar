---
title: Installation
keyword: InstallationPage
sidebar:
  order: 0
---

:::caution
This project is still in the making and not ready to be used in production!
:::


## Compatibility

At this time this package is only compatible with Angular 19.2.1 or above.

## Primary Installation via Angular Schematic (ng-add)

Running the following command will install ngx-formwork, configure your application providers, and register the core schematics:

```shell
ng add ngx-formwork
```

This schematic will:
- Install the `ngx-formwork` package from npm.
- Update your `package.json` and `angular.json`.
- Add the Formwork provider to your `app.config.ts` (or `AppModule`).
- Register the default schematics for scaffolding new controls, groups, and blocks.

## Manual Installation

Install _ngx-formwork_ manually if you prefer not to use the schematic:

```shell
npm i ngx-formwork
```

For manual setup and configuration, see the [Manual Setup guide](/getting-started/manuel-setup/).
