import { RegistrationType } from '../../_setup';

export interface Schema {
  project?: string;
  registrationStyle?: RegistrationType;
  provideInline?: boolean;
  providerConfigPath?: string;
  providerConfigFileName?: string;

  includeSyncValidators?: boolean;
  includeAsyncValidators?: boolean;

  useHelper?: boolean;
  helperPath?: string;

  splitRegistrations?: boolean;
  registrationsPath?: string;

  useSchematicConfig?: boolean;
  schematicsConfigPath?: string;
  schematicConfigFileName?: string;

  installSchematics?: boolean;
}

export interface RuleContext extends Schema {
  projectRoot: string;
  appConfigPath: string;
  projectName: string;
  useTokens: boolean;
}
