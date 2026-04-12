import { inputBinding, isSignal, signal } from '@angular/core';

export function createBinding<T extends object>(key: string, config: T) {
  const source: unknown = config[key as keyof T];

  if (isSignal(source)) {
    return inputBinding(key, source);
  }

  return inputBinding(key, signal(source));
}
