import type { Tree } from '@angular-devkit/schematics';
import type { logging } from '@angular-devkit/core';
import { FormModel } from '../model';

export interface EmitPaths {
  /** Real on-disk workspace root. Tree paths are virtual and '/'-rooted; this is not. */
  workspaceRoot: string;
  /** Tree-relative project source root, e.g. `projects/app/src`. */
  projectRoot: string;
  /**
   * Tree path to write to, already resolved against the project root, or
   * null when the entry sets none. An emitter writes here as-is; it must not
   * re-apply the project-relative convention itself.
   */
  output: string | null;
}

export interface EmitOptions {
  docs: boolean;
  [key: string]: unknown;
}

export interface EmitContext {
  tree: Tree;
  options: EmitOptions;
  logger: logging.LoggerApi;
  paths: EmitPaths;
}

export interface Emitter {
  name: string;
  emit(model: FormModel, ctx: EmitContext): void | Promise<void>;
}

export function defineEmitter(emitter: Emitter): Emitter {
  return emitter;
}
