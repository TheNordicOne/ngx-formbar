import { AbstractControl, ValidationErrors } from '@angular/forms';
import { Observable, of } from 'rxjs';

export function letterValidator(
  control: AbstractControl<string | undefined | null>,
): ValidationErrors | null {
  const value = control.value;
  if (containsText(value, 'a')) {
    return null;
  }
  return { letter: { value } };
}

export function asyncValidator(
  control: AbstractControl<string | undefined | null>,
): Observable<ValidationErrors | null> {
  const value = control.value;
  if (containsText(value, 'async')) {
    return of(null);
  }
  return of({ async: { value } });
}

export function noDuplicateValuesValidator(
  control: AbstractControl<unknown>,
): ValidationErrors | null {
  const value = control.value;

  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const values = Object.values(value);

  const uniqueSet = new Set(values);
  const duplicates = values.filter((item) => {
    if (uniqueSet.has(item)) {
      uniqueSet.delete(item);
      return false;
    }
    return true;
  });

  return duplicates.length > 0 ? { duplicates: true } : null;
}

export function forbiddenLetterAValidator(
  control: AbstractControl<unknown>,
): ValidationErrors | null {
  const value = control.value;
  if (!value) {
    return null;
  }
  if (typeof value !== 'object') {
    const includesA = containsText(value, 'a');
    return includesA ? { forbiddenLetterA: { value } } : null;
  }

  const values = Object.values(value);
  const someValueIncludesA = values.some((v) => containsText(v, 'a'));
  return someValueIncludesA ? { forbiddenLetterA: { value } } : null;
}

export function asyncGroupValidator(
  control: AbstractControl<unknown>,
): Observable<ValidationErrors | null> {
  const value = control.value;
  if (!value) {
    return of(null);
  }
  if (typeof value !== 'object') {
    const includesAsync = containsText(value, 'sync');
    return includesAsync ? of(null) : of({ async: { value } });
  }

  const values = Object.values(value);
  const someValueIncludesAsync = values.some((v) => containsText(v, 'sync'));
  return someValueIncludesAsync ? of(null) : of({ async: { value } });
}

function containsText(value: unknown, text: string) {
  if (typeof value !== 'string') {
    return false;
  }
  return value.toLowerCase().includes(text);
}
