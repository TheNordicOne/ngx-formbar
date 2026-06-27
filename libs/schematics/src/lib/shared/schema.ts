import {
  BaseGenerateSchematicConfig,
  RegistrationType,
} from '@ngx-formbar/setup';

export interface Schema extends BaseGenerateSchematicConfig {
  name?: string;
  key: string;
  path?: string;
  project?: string;
  viewProviderHelperPath?: string;
  schematicsConfig?: string;
}

export interface ScaffoldContext extends Schema {
  registrationType: RegistrationType;
  resolvedName: string;
  interfaceName: string;
  interfaceFileName: string;
  componentName: string;
  componentClassName: string;
  componentFileName: string;
  componentPath: string;
  componentFilePath: string;
  projectRoot: string;
  hasViewProviderHelper: boolean;
  viewProviderHelperPath?: string;
  viewProviderIdentifier?: string;
  controlRegistrationsPath?: string | null;
}

export interface RegisterComponentContext {
  controlRegistrationsPath?: string | null;
  key: string;
  componentFilePath: string;
  componentClassName: string;
}
