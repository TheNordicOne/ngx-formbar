This page describes the different concepts and how everything works. It is not required to understand this for normal usage, but valuable in case you configure _ngx-formbar_ by yourself or just are curios.

## Registration Types

In _ngx-formbar_ there are two ways to register controls and validators: `token` and `config`.

The differentiation is only relevant for the schematics, as they use this information to decide what kind of file to expect. This is to reduce the amount of work that needs to be done whenever a schematic tries to register a component.

A token based registration uses a custom injection token to provide the registration to the relevant services.

A config based registration uses an object for mapping the keys to the controls. This is then internally translated into the same injection token.

In the end, all values are provided through Angulars dependency injection. The major difference comes from how the injection token is build.

### Resolving registrations

While technically nothing prevents you from registering controls and validators through both registration styles simultaneously, this should not be done. Mixing token-based and config-based registration is not supported.

If you provide an object based registration to the `provideFormbar` function and also add the token to the providers array, there are two possible outcomes:
- You first call `provideFormbar` and then add the token: The registrations from the token win
- You first add the token, then call `provideFormbar`: The registrations from the object win

However, within the same registration style, you can provide multiple sets of registrations using injection tokens with `multi: true`. These are resolved as follows:

- **Components**: Only the last provided map will be used
- **Validators**: All maps are collected and merged, with later entries overriding earlier ones for duplicate keys
- **Global config**: All configs are deeply merged, with nested object properties preserved

See the [Formbar Configuration guide](/reactive-forms/guides/formbar-configuration) for details on code splitting with injection tokens.
