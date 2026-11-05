import type { Parser } from './core';
import { type HookEnv, Hooks } from './hooks';

describe('Hooks', () => {
  const env: HookEnv = { context: {} as Parser };

  it('does nothing for a name without callbacks', () => {
    const hooks = new Hooks();

    expect(() => {
      hooks.run('none', env);
      hooks.search('none', env);
    }).not.toThrow();
  });
});
