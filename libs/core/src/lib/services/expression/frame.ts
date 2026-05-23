/**
 * A single scope frame. The outermost frame is the user's form context;
 * arrow function invocations push frames with just their parameter
 * bindings. Identifier lookups walk innermost-to-outermost so inner
 * params shadow outer names.
 */
export type Frame = Record<string, unknown>;
