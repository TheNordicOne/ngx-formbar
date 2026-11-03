import {
  BaseGenerateSchematicConfig,
  RegistrationType,
} from '@ngx-formbar/setup';

export interface Schema extends BaseGenerateSchematicConfig {
  name?: string;
  key: string;
  path?: string;
  project?: string;
  registrationType?: RegistrationType;
  controlRegistrationsPath?: string;
  viewProviderHelperPath?: string;
  schematicsConfig?: string;
}

export type ScaffoldType = 'control' | 'group' | 'block' | 'array';

export interface ScaffoldContext extends Schema {
  registrationType: RegistrationType;
  registrationKind: ScaffoldType;
  contentTypeReference?: string;
  resolvedName: string;
  interfaceName: string;
  interfaceFileName: string;
  componentName: string;
  componentClassName: string;
  componentFileName: string;
  componentPath: string;
  componentFilePath: string;
  sourceRoot: string;
  tsConfigPath: string;
  hasViewProviderHelper: boolean;
  viewProviderHelperPath?: string;
  viewProviderIdentifier?: string;
}

export interface RegisterComponentContext {
  controlRegistrationsPath?: string | null;
  key: string;
  componentFilePath: string;
  componentClassName: string;
  tsConfigPath: string;
  /** A `register` run meets every component it registered before. */
  alreadyRegisteredLevel: 'info' | 'warn';
}
