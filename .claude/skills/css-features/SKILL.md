---
name: css-features
description: Modern CSS features — oklch colors, relative color syntax, container queries, and Baseline 2024. Activate when editing `.scss` or `.css` files involving colors, responsive design, selectors like `:has()`, or any color manipulation.
license: MIT
---

# Modern CSS Features

Use Baseline 2024 features. Verify availability on caniuse/MDN before using newer features.

## Colors

- **Use `oklch()` color space** — NEVER use hex, `rgb()`, or `hsl()` for colors
- **Use relative color syntax for color manipulation** — `oklch(from var(--color) calc(l - 0.1) c h)`
- **Do NOT use `color-mix()`** for color manipulation — it blends all channels at once and can shift hue unexpectedly
- `color-mix()` is acceptable only for truly blending two distinct colors
- Define color tokens as `oklch` values in CSS custom properties

### Relative Color Syntax — Channel Controls

- `l` (lightness): 0–1 — `calc(l + 0.2)` to lighten, `calc(l - 0.2)` to darken
- `c` (chroma): 0–0.4 — `calc(c * 0.5)` to desaturate, `calc(c * 1.5)` to saturate
- `h` (hue): 0–360 — `calc(h + 180)` for complementary
- Alpha: append `/ 0.5` for transparency — `oklch(from var(--color) l c h / 0.5)`
- Combine adjustments: `oklch(from var(--color) calc(l + 0.15) calc(c * 0.4) h)`

## Container Queries

- **Use container queries over media queries** for component-level responsiveness
- Set `container-type: inline-size` on wrapper elements
- Use `container-name` for explicit targeting
- Container query units: `cqi` (inline), `cqb` (block), `cqmin`, `cqmax`

## Selectors & Properties

- **`:has()`** — use for parent/ancestor selection based on child state
- **Native CSS nesting** — use `&` nesting; no preprocessor required for this
- **Cascade layers** (`@layer`) — use for specificity ordering in large codebases: `@layer reset, base, components, utilities`
- **`text-wrap: balance`** for headings and captions, **`text-wrap: pretty`** for paragraphs
