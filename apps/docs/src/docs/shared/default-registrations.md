Without a configured file, the schematic uses the first of these that exists in the source root:

- `app/registrations/component-registrations.ts`
- `app/formbar.config.ts`
- `app/app.config.ts`

When the file is missing or holds no component registrations, the schematic logs a warning and skips the registration.
