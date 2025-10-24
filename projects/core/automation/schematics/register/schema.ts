import { FormworkComponentInfo } from './component-info.type';
import { RegistrationType } from '../../shared/shared-config.type';

export interface DiscoverOptions {
  project?: string;
  registrationType?: RegistrationType;
  controlRegistrations?: string | null;
  schematicsConfig?: string;
  include?: string[];
  exclude?: string[];
}

export interface RegisterContext extends DiscoverOptions {
  components: FormworkComponentInfo[];
  registrationType: RegistrationType;
}
