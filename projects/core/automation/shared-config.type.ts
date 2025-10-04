export type RegistrationType = 'token' | 'config';

export interface BaseGenerateSchematicConfig {
  interfaceSuffix?: string;
  componentSuffix?: string;
  hostDirectiveHelperPath?: string;
}

export interface DiscoveryConfig {
  include?: string[];
  exclude?: string[];
}

export interface NgxFormworkAutomationConfig {
  registrationType: RegistrationType;
  controlRegistrationsPath?: string;
  viewProviderHelperPath?: string;
  discovery?: DiscoveryConfig;
  control?: BaseGenerateSchematicConfig;
  group?: BaseGenerateSchematicConfig;
  block?: BaseGenerateSchematicConfig;
}
