export const CORE_PACKAGE_NAME = '@ngx-formbar/core';
export const REACTIVE_FORMS_PACKAGE_NAME = '@ngx-formbar/reactive-forms';
export const SCHEMATICS_PACKAGE_NAME = '@ngx-formbar/schematics';

export const DEFAULT_APP_CONFIG_FILE = 'app/app.config.ts';

export const DEFAULT_PROVIDER_CONFIG_PATH = 'app';
export const DEFAULT_PROVIDER_CONFIG_FILE_NAME = 'formbar.config.ts';

export const DEFAULT_HELPER_PATH = 'app/shared/helper';

export const DEFAULT_CONTENT_TYPE_PATH = 'app/types';
export const DEFAULT_CONTENT_TYPE_FILE_NAME = 'content.type';
export const DEFAULT_CONTENT_TYPE_EXPORT_NAME = 'AppContent';

export const SCAFFOLD_GENERATORS = ['control', 'group', 'block', 'array'];
export const SCHEMATICS_GENERATORS = [
  ...SCAFFOLD_GENERATORS,
  'register',
  'schema',
];
