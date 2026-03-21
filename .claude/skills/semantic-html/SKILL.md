---
name: semantic-html
description: Semantic HTML structure, landmarks, and Baseline 2024 elements. Activate when writing or reviewing HTML structure — page layout with landmarks, choosing between `<dialog>`/`popover`/`<search>`/`<details>`, or working with tables, images, and media.
license: MIT
---

# Semantic HTML

Use elements for their meaning, not their appearance. Prefer native HTML over ARIA.

**First rule of ARIA:** Don't use ARIA if a native HTML element provides the semantics you need.

## Document Structure

- Exactly one `<h1>` per page — never skip heading levels
- Only one `<main>` per page
- Label multiple `<nav>` elements with `aria-label` to distinguish them
- A `<section>` without a heading/label has no landmark role — only use it when you can label it
- **No redundant roles** — never `<nav role="navigation">` or `<main role="main">`

### Sectioning Elements

| Element | Landmark | Use For |
|:--------|:---------|:--------|
| `<header>` | `banner` (top-level) | Site header |
| `<nav>` | `navigation` | Navigation menus |
| `<main>` | `main` | Primary page content |
| `<aside>` | `complementary` | Sidebars, related content |
| `<footer>` | `contentinfo` (top-level) | Site footer |
| `<section>` | `region` (when labelled) | Thematic grouping |
| `<article>` | `article` | Self-contained content |

### Skip Links

Provide a skip link as the first focusable element: `<a href="#main-content" class="skip-link">Skip to main content</a>`

## Modern HTML (Baseline 2024)

### `<dialog>` — Modals

- Use `showModal()` for modal dialogs (traps focus, Escape to close, `::backdrop`)
- Use `show()` for non-modal (tooltips, notifications)
- Add `aria-labelledby` pointing to the dialog heading
- Use `<form method="dialog">` to close on submit
- Return focus to the triggering element on close
- **Never use `<div role="dialog">`** when `<dialog>` is available

### Popover API — Lightweight Overlays

- Use `popover` attribute for tooltips, menus, dropdowns — no JS needed for basic toggle
- `popover="auto"` — auto-dismisses on outside click/Escape; only one open at a time
- `popover="manual"` — must be explicitly closed; multiple can coexist
- Use `popovertarget` to connect trigger to popover
- Add appropriate ARIA roles to popover content (`role="menu"`, `role="tooltip"`, etc.)
- **Use `<dialog>` for focus-trapping modals**, `popover` for everything else

### `<search>` Element

- Use `<search>` as semantic wrapper for search functionality — creates a `search` landmark
- **Never use `<div role="search">`** when `<search>` is available

### `<details>` / `<summary>` — Accordions

- Use the same `name` attribute to create exclusive accordion groups (Baseline 2024)
- `open` attribute to expand a panel by default
- Don't use for critical content that must always be visible

## Tables

- **Only for tabular data** — never for layout (use CSS Grid)
- Always include `<caption>` to describe purpose
- Use `<thead>`, `<tbody>`, `<tfoot>` to group rows
- `scope="col"` on column headers, `scope="row"` on row headers

## Images & Media

- Every `<img>` must have `alt` — empty `alt=""` for decorative images
- Informative images: describe content. Functional (in link/button): describe the action
- Use `<picture>` for art direction and format switching
- Use `<figure>` + `<figcaption>` for captioned content
- `loading="lazy"` for below-the-fold images — **never** lazy-load above-the-fold
- `fetchpriority="high"` for LCP images
- Always provide `width`/`height` or `aspect-ratio` to prevent layout shifts

## `<output>` Element

- Use for calculation results or values derived from user input
- Has implicit `role="status"` / `aria-live="polite"` — screen readers announce changes
- Use `for` attribute to reference contributing inputs
