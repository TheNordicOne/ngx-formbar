/**
 * Hook system for the vendored expression parser.
 *
 * Plugins register callbacks under named hook points. The core parser invokes
 * hooks at well-known moments (`gobble-token`, `after-expression`, etc.) to let
 * plugins extend the grammar.
 *
 * Adapted from JSEP (https://github.com/EricSmekens/jsep) under MIT license.
 */

import type { Parser } from './core';
import type { Expression, SequenceExpression, SpreadElement } from './ast';

export interface HookEnv {
  context: Parser;
  node?: Expression | SpreadElement | SequenceExpression | false;
}

export type HookCallback = (this: Parser, env: HookEnv) => void;

export class Hooks {
  private readonly registry: Record<string, HookCallback[] | undefined> = {};

  add(name: string, callback: HookCallback): void {
    (this.registry[name] ??= []).push(callback);
  }

  run(name: string, env: HookEnv): void {
    for (const callback of this.registry[name] ?? []) {
      callback.call(env.context, env);
    }
  }

  // Stops at the first callback that assigns `env.node`, so plugins can
  // replace the next token entirely.
  search(name: string, env: HookEnv): void {
    for (const callback of this.registry[name] ?? []) {
      callback.call(env.context, env);
      if (env.node) {
        return;
      }
    }
  }
}
