import { RegistrationType } from '@ngx-formbar/setup';
import { RootConfig } from './root-config';

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

export interface RuleContext
  extends Omit<
    Schema,
    | 'registrationsPath'
    | 'providerConfigPath'
    | 'helperPath'
    | 'schematicsConfigPath'
  > {
  registrationStyle: RegistrationType;
  providerConfigFileName: string;
  schematicConfigFileName: string;
  projectRoot: string;
  appConfigPath: string;
  rootConfig: RootConfig;
  projectName: string;
  useTokens: boolean;
  registrationsDirectory: string;
  providerConfigDirectory: string;
  helperDirectory: string;
  schematicsConfigDirectory: string;
}
