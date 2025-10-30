import { RegistrationType } from '../../shared/shared-config.type';
import { FormbarComponentInfo } from './component-info.type';

export interface DiscoverOptions {
  project?: string;
  registrationType?: RegistrationType;
  controlRegistrations?: string | null;
  schematicsConfig?: string;
  include?: string[];
  exclude?: string[];
}

export interface RegisterContext extends DiscoverOptions {
  components: FormbarComponentInfo[];
  registrationType: RegistrationType;
}
