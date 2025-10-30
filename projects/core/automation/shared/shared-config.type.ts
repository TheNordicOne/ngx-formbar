export type RegistrationType = 'token' | 'config';

export interface BaseGenerateSchematicConfig {
  interfaceSuffix?: string;
  componentSuffix?: string;
  hostDirectiveHelperPath?: string;
  skipRegistration?: boolean;
}

export interface DiscoveryConfig {
  include?: string[];
  exclude?: string[];
}

export interface NgxFormbarAutomationConfig {
  registrationType?: RegistrationType;
  controlRegistrationsPath?: string;
  viewProviderHelperPath?: string;
  discovery?: DiscoveryConfig;
  control?: BaseGenerateSchematicConfig;
  group?: BaseGenerateSchematicConfig;
  block?: BaseGenerateSchematicConfig;
}
