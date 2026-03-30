---
name: a11y-forms
description: Accessible form patterns. Activate when writing or editing HTML forms, `<input>`, `<select>`, `<textarea>`, or form validation logic — covers labelling, input types, autocomplete, and error announcements.
license: MIT
---

# Accessible Forms

## Labelling

**Every form control MUST have an accessible name.** Prefer visible `<label>` elements.

- Use explicit association (`<label for="id">`) or implicit wrapping (`<label><input></label>`)
- **Placeholder is NOT a label** — never rely on `placeholder` for the accessible name
- Icon-only buttons need `aria-label` or visually hidden text

## Grouping

- Use `<fieldset>` + `<legend>` to group related controls (radio groups, checkbox sets, related fields)

## Input Types

Use the correct `type` — it affects mobile keyboards, autofill, and validation:

| Data | Type |
|:-----|:-----|
| Email | `type="email"` |
| Phone | `type="tel"` |
| URL | `type="url"` |
| Number | `type="number"` |
| Date | `type="date"` |
| Search | `type="search"` |
| Password | `type="password"` |

## Autocomplete

Always set `autocomplete` on identity and credential fields: `name`, `email`, `tel`, `street-address`, `new-password`, etc.

## Validation

- Use native validation attributes first: `required`, `minlength`, `maxlength`, `min`, `max`, `pattern`
- Set `aria-invalid="true"` on inputs with errors
- Connect error messages with `aria-describedby`
- Use `role="alert"` or `aria-live="assertive"` on error containers for screen reader announcements
- Group form-level errors in a summary linking to each invalid field
