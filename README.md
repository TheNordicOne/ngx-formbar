# Formbar

![NPM Version](https://img.shields.io/npm/v/@ngx-formbar/core?logo=npm&label=NPM%20Version)
![NPM Downloads](https://img.shields.io/npm/dw/@ngx-formbar/core?label=Downloads)

A highly flexible framework for generating declarative reactive forms, based on a configuration.

This package provides a framework for creating Angular Reactive Forms, based on a configuration. This configuration can come from a server in the form of JSON or directly from an object written in TypeScript. It is as close to Angular as possible, to give you the most flexibility, while still taking care of the heavy lifting.

> [!TIP]
> The full documentation can be found on [ngx-formbar.net](https://docs.ngx-formbar.net)

## Installation

**Primary (recommended)**

Install and configure via Angular schematic:

```bash
ng add @ngx-formbar/core
```

This will install the package, update your project files, and configure the Formbar provider.

**Manual**

```bash
npm install @ngx-formbar/core
```

For manual setup, you must provide Formbar in your `app.config.ts` or `AppModule`.

## Compatibility

At this time this package is only compatible with Angular 19.2.1 or above.
