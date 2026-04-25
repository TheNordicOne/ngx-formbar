import {
  inputBinding,
  isSignal,
  reflectComponentType,
  signal,
  Type,
} from '@angular/core';

export function createBinding<T extends object>(key: string, config: T) {
  const source: unknown = config[key as keyof T];

  if (isSignal(source)) {
    return inputBinding(key, source);
  }

  return inputBinding(key, signal(source));
}

export function getInputNames(component: Type<unknown>) {
  const mirror = reflectComponentType(component);
  return mirror?.inputs.map((i) => i.templateName) ?? [];
}
