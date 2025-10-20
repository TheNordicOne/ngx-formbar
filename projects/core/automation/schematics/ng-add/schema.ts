import { RegistrationType } from '../../shared/shared-config.type';

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
}

export interface RuleContext extends Schema {
  projectRoot: string;
  appConfigPath: string;
  projectName: string;
  useTokens: boolean;
}
