export type RegistrationType = 'token' | 'config';

export interface BaseGenerateSchematicConfig {
  /** Relative to the source root, unlike the workspace-relative `--path`. */
  path?: string;
  interfaceSuffix?: string;
  componentSuffix?: string;
  interfaceFileSuffix?: string;
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
  array?: BaseGenerateSchematicConfig;
  schema?: SchemaConfig;
}

export interface SchemaEmitterEntry {
  use: string;
  output?: string;
  options?: Record<string, unknown>;
}

export interface SchemaConfig {
  type?: string;
  emitters?: SchemaEmitterEntry[];
}
