---
name: css-layout
description: CSS layout rules — Grid vs Flexbox and logical properties. Activate when editing `.scss` or `.css` files involving layout, positioning, spacing, margins, padding, or sizing. Enforces logical properties for RTL/i18n.
license: MIT
---

# CSS Layout

## Grid vs Flexbox

**Prefer CSS Grid for layout.** Use Flexbox only for single-axis inline flows.

- **Grid:** Page layouts, card grids, form layouts, dashboard panels — anything aligning across both axes
- **Flexbox:** Tag lists, chip groups, button rows, breadcrumbs — single-axis flows that may wrap
- **Centering a single item:** Flexbox is fine
- Use `subgrid` when children need to align with a parent grid

## Logical Properties

**ALWAYS use CSS logical properties.** Physical directional properties are forbidden.

- `margin-inline-start` not `margin-left` — `margin-block-start` not `margin-top`
- `padding-inline` / `padding-block` not `padding-left` / `padding-top`
- `inline-size` not `width` — `block-size` not `height`
- `max-inline-size` not `max-width` — `min-block-size` not `min-height`
- `inset-inline-start` not `left` — `inset-block-start` not `top`
- `border-inline-start` not `border-left`
- `border-start-start-radius` not `border-top-left-radius`
- Use axis shorthands when setting both sides: `margin-block: 1rem 2rem`
- **`inset` is physical** — use `inset-block-*` / `inset-inline-*` for logical positioning
- **Never mix** logical and physical properties in the same ruleset

### Logical Axes

- **Block axis:** vertical in horizontal writing modes (top/bottom)
- **Inline axis:** horizontal in horizontal writing modes (left/right)
- In RTL, inline direction reverses. In vertical writing modes, axes rotate.

## No `margin: auto` for Pushing

**Never use `margin-inline-start: auto`** or similar `margin: auto` tricks to push elements. Use proper Grid or Flexbox placement on the parent instead.

```scss
// WRONG
.action { margin-inline-start: auto; }

// CORRECT
.toolbar {
  display: grid;
  grid-template-columns: 1fr auto;
}
```
