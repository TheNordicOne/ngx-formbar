This page explains how to configure _ngx-formbar_ itself. It covers the provider setup, the registration system, and the global options that tell _ngx-formbar_ how to operate. This is separate from [Configuring a Form](/fundamentals/configuration), which describes the object structure that defines what a form looks like.

## Overview
 
Configuration in _ngx-formbar_ is split into two categories:

- **Runtime configuration**: Sets up component registrations, global options, and default behavior. This is what your application needs to run.
- **Schematics configuration**: Default values for CLI generators stored in `formbar-schematic.config.json`. This file is only used at build time and has no effect at runtime. See [Generators](/fundamentals/generators) and [Register](/fundamentals/register) for details.

The rest of this page covers runtime configuration. Integration packages like `@ngx-formbar/reactive-forms` add their own configuration options on top of what is described here. See your integration package's guide for those details.
 
## How Configuration Flows

The diagram below shows how configuration reaches _ngx-formbar_ at runtime. It starts with the files you write, flows through injection tokens with their defaults, merges where needed, and ends at the services that components consume.

```
┌─ Your Files ─────────────────────────────────────────────────┐
│                                                              │
│  app.config.ts              formbar.config.ts (optional)     │
│  ┌──────────────────────┐    ┌────────────────────────────┐  │
│  │ provideFormbar(cfg)  │◀──│ defineFormbarConfig({...}) │  │
│  │ // or token providers│    └────────────────────────────┘  │
│  └──────────┬───────────┘                                    │
└─────────────┼────────────────────────────────────────────────┘
              │
              ▼
┌─ Injection Tokens ───────────────────────────────────────────┐
│                                                              │
│  NGX_FW_COMPONENT_REGISTRATIONS    default: empty Map        │
│  NGX_FW_CONFIG                     default: {}    (multi)    │
│                                                              │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐       │
│    Integration packages add their own tokens here            │
│    e.g. NGX_FW_VALIDATOR_REGISTRATIONS (reactive-forms)      │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘       │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌─ Merging ────────────────────────────────────────────────────┐
│                                                              │
│  Components:    last provided map wins                       │
│  Global config: all values deep-merged                       │
│  (Integration packages define their own merge strategies)    │
│                                                              │
│  Result: NGX_FW_CONFIG_RESOLVED (merged global config)       │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌─ Services ───────────────────────────────────────────────────┐
│                                                              │
│  ComponentRegistrationService   exposes registrations signal │
│  NgxFbConfigurationService      exposes resolved config      │
│                                                              │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌─ Components / Directives ────────────────────────────────────┐
│  Inject services, read signals, render controls              │
└──────────────────────────────────────────────────────────────┘
```

## Component Registrations

Maps a string type name to a component. When a form control has `type: 'text'`, _ngx-formbar_ looks up `'text'` in this map to determine which component to render.

Each entry can be **static** (eagerly imported) or **lazy** (loaded on demand):

```typescript
componentRegistrations: {
  text: staticComponent(TextComponent),
  select: loadComponent(() => import('./select.component').then(m => m.SelectComponent)),
}
```

Each entry also accepts optional behavior flags:

| Option             | Values                | Description                                                        |
|--------------------|-----------------------|--------------------------------------------------------------------|
| `hiddenHandling`   | `'auto' \| 'manual'` | Whether the framework manages visibility or the component does     |
| `disabledHandling` | `'auto' \| 'manual'` | Whether the framework manages disabled state or the component does |

## Global Configuration

Options that apply to all controls, groups, and blocks. Provided through the `globalConfig` property or the `NGX_FW_CONFIG` token.

| Property          | Type              | Description                                                                                    |
|-------------------|-------------------|------------------------------------------------------------------------------------------------|
| `testIdBuilderFn` | `TestIdBuilderFn` | Function that builds test IDs for controls given the content, name, and optional parent test ID |

## Registration Types

There are two ways to register components: **config-based** and **token-based**. Integration packages follow the same pattern for their own registrations.

### Config-Based Registration

Pass registrations as properties of the configuration object to `provideFormbar()`. This is the simpler approach.

```typescript
provideFormbar({
  componentRegistrations: { /* ... */ },
})
```

### Token-Based Registration

Provide Angular injection tokens directly in your providers array. This gives more control over provider ordering and allows registration from separate modules or libraries.

```typescript
providers: [
  provideFormbar(),
  {
    provide: NGX_FW_COMPONENT_REGISTRATIONS,
    useValue: new Map([/* ... */]),
  },
]
```

> **Warning**
> Do not mix config-based and token-based registration for the same concern. If you provide component registrations both through `provideFormbar({ componentRegistrations })` and through the `NGX_FW_COMPONENT_REGISTRATIONS` token, only one will take effect depending on provider ordering.

### Resolution and Merging

When multiple registrations are provided (via `multi: true` tokens or multiple calls), they are resolved as follows:

| Concern       | Strategy                                                       |
|---------------|----------------------------------------------------------------|
| Components    | Only the last provided map is used                             |
| Global config | All configs are deeply merged, nested properties are preserved |

Integration packages define their own merging behavior for their registrations.

## Next Steps

See your integration package's guide for additional configuration options and code splitting patterns:

- [Reactive Forms: Formbar Configuration](/reactive-forms/guides/formbar-configuration)
