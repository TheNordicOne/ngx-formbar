import {
  BaseGenerateSchematicConfig,
  RegistrationType,
} from '../../shared/shared-config.type';

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
  componentName: string;
  componentClassName: string;
  componentPath: string;
  componentFilePath: string;
  projectRoot: string;
  hasViewProviderHelper: boolean;
  viewProviderHelperPath?: string;
  hasHostDirectiveHelper: boolean;
  hostDirectiveHelperPath?: string;
  controlRegistrationsPath?: string | null;
}

export interface RegisterComponentContext {
  controlRegistrationsPath?: string | null;
  key: string;
  componentFilePath: string;
  componentClassName: string;
}
