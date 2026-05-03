import {
  inputBinding,
  isSignal,
  reflectComponentType,
  Signal,
  signal,
  Type,
} from '@angular/core';

export function createBindings(
  component: Type<unknown>,
  signalMap: Map<string, Signal<unknown>>,
  config: Signal<object>,
) {
  const inputNames = getInputNames(component);

  return inputNames.map((templateName) => {
    const mapped = signalMap.get(templateName);

    if (mapped !== undefined) {
      return inputBinding(templateName, mapped);
    }

    return createBinding(templateName, config());
  });
}

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
