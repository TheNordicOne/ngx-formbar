---
name: a11y-interactive
description: Accessible interactive patterns. Activate when writing buttons, links, keyboard-navigable widgets, focus management, or dynamic content that needs screen reader announcements — covers links vs buttons, tabindex, roving focus, and ARIA live regions.
license: MIT
---

# Accessible Interactivity

## Links vs Buttons

**Links navigate. Buttons perform actions.** This distinction is critical for assistive technology.

- `<a href="...">` — navigation (screen readers announce "link")
- `<button type="button">` — actions (screen readers announce "button")
- `<button type="submit">` — form submission
- **Never** use `<div>`/`<span>` as interactive elements — they lack focus, keyboard, and role semantics
- A `<button>` without `type` defaults to `submit` inside forms — always set `type="button"` for non-submit buttons
- Icon-only buttons: provide `aria-label` and set `aria-hidden="true"` on the icon

## Keyboard Navigation

- **Never** use `tabindex` > 0 — it disrupts natural DOM order
- `tabindex="0"` — only on custom interactive widgets (pair with `role` + keyboard handlers)
- `tabindex="-1"` — programmatic focus only (not in tab order)

### Roving Tabindex for Composite Widgets

For tabs, menus, and toolbars: one item has `tabindex="0"`, the rest have `tabindex="-1"`. Arrow keys move focus within the group.

**Expected keyboard behavior:**
- **Tab/Shift+Tab** — into and out of the composite widget
- **Arrow keys** — between items within the widget
- **Home/End** — first/last item
- **Enter/Space** — activate focused item
- **Escape** — close overlays, cancel actions

## Focus Management

- After removing content: move focus to a logical previous element or heading
- After adding major content: move focus to it or announce via live region
- Use `tabindex="-1"` on non-interactive elements receiving programmatic focus
- `<dialog>` with `showModal()` handles focus trapping automatically

## ARIA Live Regions

- **`role="alert"` / `aria-live="assertive"`** — errors, critical warnings (interrupts immediately)
- **`role="status"` / `aria-live="polite"`** — success messages, progress, non-critical updates (waits for idle)
- The live region container **must exist in the DOM before content is injected** — changing content triggers the announcement, not adding the container
- Use `aria-busy="true"` during loading to batch announcements
- Use `aria-atomic="true"` when the entire region should be re-announced on change
- **Use `role="alert"` sparingly** — prefer `role="status"` for non-critical updates
