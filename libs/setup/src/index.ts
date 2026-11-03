export {
  findProvidersProperty,
  findVariableWithObjectLiteral,
  unwrapToObjectLiteral,
} from './lib/ast';
export { isCallee } from './lib/ast/decorators';
export { exportsIdentifier } from './lib/ast/exports';
export { loadSourceFile } from './lib/ast/parse';
export {
  addComponentRegistration,
  componentRegistrationsObjectHasKey,
  componentRegistrationsObjectUsesIdentifier,
  findComponentRegistrationsNode,
  findComponentRegistrationsObject,
  findMapArrayLiteral,
  registrationNodeHasKey,
  registrationNodeUsesIdentifier,
  updateMapEntries,
} from './lib/ast/registrations';
export { addUnionMember } from './lib/ast/unions';
export {
  DEFAULT_COMPONENT_REGISTRATIONS_FILE_NAME,
  DEFAULT_REGISTRATION_TYPE,
  DEFAULT_REGISTRATIONS_PATH,
  DEFAULT_SCHEMATIC_CONFIG_FILE_NAME,
  DEFAULT_SCHEMATICS_CONFIG_PATH,
  NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS,
  NGX_FW_COMPONENT_REGISTRATIONS,
  NGX_FW_VALIDATOR_REGISTRATIONS,
} from './lib/constants';
export {
  findSchematicsConfig,
  loadAutomationConfig,
  registrationsMissingMessage,
  registrationsNotFoundMessage,
  resolveRegistrationsPath,
} from './lib/file';
export {
  getAngularComponentNaming,
  getProjectDefinition,
  isInsideProject,
  otherProjectDirectories,
  resolveProjectName,
} from './lib/helper';
export type { AngularComponentNaming } from './lib/helper';
export type {
  BaseGenerateSchematicConfig,
  NgxFormbarAutomationConfig,
  RegistrationType,
  SchemaEmitterEntry,
} from './lib/shared-config.type';
export {
  isWithin,
  joinToSourceRoot,
  resolveRequiredPath,
  resolveWithinWorkspace,
  sourceRootValue,
} from './lib/source-root-path';
export {
  createTreeCompilerHost,
  findTsConfigPath,
  readCompilerOptions,
} from './lib/tsconfig';
