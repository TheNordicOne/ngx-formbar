import { SchemaEmitterEntry } from '@ngx-formbar/setup';

export interface Schema {
  project?: string;
  schematicsConfig?: string;
  type?: string;
  emitter?: string[];
  output?: string;
}

export interface SchemaContext {
  typeReference: string;
  docs: boolean;
  entries: SchemaEmitterEntry[];
  projectRoot: string;
  workspaceRoot: string;
  tsConfigPath: string;
}
