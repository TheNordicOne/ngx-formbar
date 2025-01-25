# Formwork

![NPM Version](https://img.shields.io/npm/v/ngx-formwork?logo=npm&label=NPM%20Version)
![NPM Downloads](https://img.shields.io/npm/dw/ngx-formwork?label=Downloads)

[![Test and Lint](https://github.com/TheNordicOne/ngx-formwork/actions/workflows/test-and-lint.yml/badge.svg?branch=main)](https://github.com/TheNordicOne/ngx-formwork/actions/workflows/test-and-lint.yml)


A highly flexible framework for generating declarative reactive forms, based on a configuration.


## Current State

This project is still in the making and not ready to be used!

Below you find the planned features that Formwork wants to implement. The exact implementation details can and most likely will change.

## Planned Features

Overall this package provides a framework for creating Angular Reactive Forms, based on a configuration. This configuration can come from a server in the form of JSON or directly from an object written in TypeScript. It is as close to Angular as possible, to give you the most flexibility, while still taking care of the heavy lifting. 

- Create your own form controls
  - No extra packages for rendering with UI Library X or CSS Framework Y
  - Controls are fully typed
- Automatic e2e-Id generation
- Hide controls based on complex conditions and the form state
- Decide how the value of hidden controls behaves (keep value or remove it) 
- Disable controls based on complex conditions and the form state
- Mark a control as required or add other validators


## Open Feature Ideas

The following are some ideas that are interesting. There is no guarantee that they will be implemented.

- Configure how the e2e-Id looks like
- Configure the attribute name used for the e2e-Id
- Schematics for quickly scaffolding a new compatible control
- UI for creating valid configurations in JSON
