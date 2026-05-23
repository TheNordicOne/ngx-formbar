/**
 * Hook system for the vendored expression parser.
 *
 * Plugins register callbacks under named hook points. The core parser invokes
 * hooks at well-known moments (`gobble-token`, `after-token`, etc.) to let
 * plugins extend the grammar.
 *
 * Adapted from JSEP (https://github.com/EricSmekens/jsep) under MIT license.
 */

import type { Parser } from './core';
import type {
  Expression,
  SequenceExpression,
  SpreadElement,
} from './ast';

export interface HookEnv {
  context: Parser;
  node?: Expression | SpreadElement | SequenceExpression | false;
}

export type HookCallback = (this: Parser, env: HookEnv) => void;

export class Hooks {
  private readonly registry: Record<string, HookCallback[] | undefined> = {};

  add(name: string, callback: HookCallback, first = false) {
    const list = (this.registry[name] ??= []);
    if (first) {
      list.unshift(callback);
      return;
    }
    list.push(callback);
  }

  run(name: string, env: HookEnv) {
    const callbacks = this.registry[name];
    if (!callbacks) {
      return;
    }
    for (const callback of callbacks) {
      callback.call(env.context, env);
    }
  }

  // Stops at the first callback that assigns `env.node`, so plugins can
  // replace the next token entirely.
  search(name: string, env: HookEnv) {
    const callbacks = this.registry[name];
    if (!callbacks) {
      return;
    }
    for (const callback of callbacks) {
      callback.call(env.context, env);
      if (env.node) {
        return;
      }
    }
  }

  has(name: string) {
    const list = this.registry[name];
    return list !== undefined && list.length > 0;
  }
}
