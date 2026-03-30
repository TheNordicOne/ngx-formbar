
All examples use minimal styling and share the same set of control components,
validators, and form configurations. The differences lie in **how things are wired up**.

Each example page includes a live, interactive demo rendered directly in the docs,
along with the form configuration.

## What Each Example Demonstrates

| Example                       | Focus                                                                                                |
|-------------------------------|------------------------------------------------------------------------------------------------------|
| **Token-Based Registration**  | Registering components and validators via Angular DI tokens (`NGX_FW_COMPONENT_REGISTRATIONS`, etc.) |
| **Config-Based Registration** | Registering everything through `defineFormbarConfig()` and `provideFormbar()`                        |
| **Complex Form**              | Computed values, function expressions, dynamic titles, `updateOn`, `hideStrategy`, `valueStrategy`   |
| **Load From JSON**            | Loading form configuration at runtime via `HttpClient`                                               |
| **Custom Resolver**           | Implementing a custom `ComponentResolver` to swap components at runtime                              |
| **Very Large Form**           | Performance with many controls and cascading computations                                            |

## Shared Components

All examples use these control components:

- **text** — Single-line text input
- **number** — Numeric input with min/max
- **checkbox** — Boolean toggle
- **radio** — Radio button group
- **dropdown** — Select dropdown
- **textarea** — Multi-line text input
- **date** — Date picker
- **file** — File upload
- **group** — Fieldset grouping with legend
- **note** — Informational block (not a form control)
