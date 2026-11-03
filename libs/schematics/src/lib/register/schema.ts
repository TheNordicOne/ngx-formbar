import { RegistrationType } from '@ngx-formbar/setup';
import { FormbarComponentInfo } from './component-info.type';

export interface DiscoverOptions {
  project?: string;
  registrationType?: RegistrationType;
  controlRegistrationsPath?: string;
  controlRegistrations?: string | null;
  schematicsConfig?: string;
  include?: string[];
  exclude?: string[];
}

export interface RegisterContext extends DiscoverOptions {
  configuredRegistrations?: string | null;
  components: FormbarComponentInfo[];
  registrationType: RegistrationType;
}
