export type FormContext = Record<string, unknown>;

export type Expression<T> = string | ((formValue: FormContext) => T);
