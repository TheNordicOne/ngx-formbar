export interface Schema {
  project?: string;
  registrationStyle?: 'token' | 'inline' | 'file';

  includeSyncValidators?: boolean;
  includeAsyncValidators?: boolean;

  useHelper?: boolean;
  helperPath?: string;

  splitRegistrations?: boolean;
  registrationsPath?: string;

  providerConfigPath?: string;
  providerConfigFileName?: string;

  useSchematicConfig?: boolean;
  schematicsConfigPath?: string;
  schematicConfigFileName?: string;
}

export interface RuleContext extends Schema {
  projectRoot: string;
  projectName: string;
  useRegistrationConfig: boolean;
  useTokens: boolean;
}
