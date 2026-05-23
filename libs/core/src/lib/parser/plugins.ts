/**
 * Plugin contract for the vendored expression parser.
 *
 * A plugin is a name plus an `init` function that registers hooks with the
 * parser class. The grammar surface that a plugin opens (object literals,
 * arrow functions, template literals, etc.) is opt-in by registration.
 *
 * Adapted from JSEP (https://github.com/EricSmekens/jsep) under MIT license.
 */

import type { ParserStatic } from './core';

export interface Plugin {
  name: string;
  init(jsep: ParserStatic): void;
}
