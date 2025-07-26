# Formwork

![NPM Version](https://img.shields.io/npm/v/ngx-formwork?logo=npm&label=NPM%20Version)
![NPM Downloads](https://img.shields.io/npm/dw/ngx-formwork?label=Downloads)

[![Test and Lint](https://github.com/TheNordicOne/ngx-formwork/actions/workflows/lint-and-test.yml/badge.svg?branch=main)](https://github.com/TheNordicOne/ngx-formwork/actions/workflows/lint-and-test.yml)

A highly flexible framework for generating declarative reactive forms, based on a configuration.

This package provides a framework for creating Angular Reactive Forms, based on a configuration. This configuration can come from a server in the form of JSON or directly from an object written in TypeScript. It is as close to Angular as possible, to give you the most flexibility, while still taking care of the heavy lifting.

> [!TIP]
> The full documentation can be found on [ngx-formwork.net](https://ngx-formwork.net)

## Current State

> [!WARNING]
> This project is still in the making and not ready to be used in production!

## Installation

**Primary (recommended)**

Install and configure via Angular schematic:

```bash
ng add ngx-formwork
```

This will install the package, update your project files, and configure the Formwork provider.

**Manual**

```bash
npm install ngx-formwork
```

For manual setup, you must provide Formwork in your `app.config.ts` or `AppModule`.

## Compatibility

At this time this package is only compatible with Angular 19.2.1 or above.
