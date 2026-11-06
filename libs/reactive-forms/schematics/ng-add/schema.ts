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
  updateOtherProjects?: boolean;
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
  sourceRoot: string;
  appConfigPath: string;
  rootConfig: RootConfig;
  projectName: string;
  useTokens: boolean;
  registrationsDirectory: string;
  providerConfigDirectory: string;
  helperDirectory: string;
  schematicsConfigDirectory: string;
  /** Whether this run says where the schematics configuration file goes. */
  schematicsConfigNamed: boolean;
  /** The `schematicsConfig` an earlier run or the developer set in angular.json. */
  schematicsConfigLink?: string;
}
