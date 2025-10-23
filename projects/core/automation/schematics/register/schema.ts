import { FormworkComponentInfo } from './component-info.type';

export interface DiscoverOptions {
  include: string[];
  exclude: string[];
  outputPath?: string;
  configPath?: string;
}

export interface RegisterContext extends DiscoverOptions {
  components: FormworkComponentInfo[];
}
