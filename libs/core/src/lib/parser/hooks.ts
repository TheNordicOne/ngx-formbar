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
  private readonly registry: Record<string, HookCallback[]> = {};

  add(name: string, callback: HookCallback, first = false): void {
    if (!this.registry[name]) {
      this.registry[name] = [];
    }
    if (first) {
      this.registry[name].unshift(callback);
    } else {
      this.registry[name].push(callback);
    }
  }

  run(name: string, env: HookEnv): void {
    const callbacks = this.registry[name];
    if (!callbacks) {
      return;
    }
    for (const callback of callbacks) {
      callback.call(env.context, env);
    }
  }

  /**
   * Invoke registered callbacks one at a time until one assigns `env.node`.
   * Used by the parser to let plugins replace the next token entirely.
   */
  search(name: string, env: HookEnv): void {
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

  /**
   * Whether any callbacks are registered for this hook. Cheap pre-check
   * so the parser can skip the env-allocation fast path.
   */
  has(name: string): boolean {
    return Array.isArray(this.registry[name]) && this.registry[name].length > 0;
  }
}
