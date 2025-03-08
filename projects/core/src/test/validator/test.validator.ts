import { AbstractControl, ValidationErrors } from '@angular/forms';
import { Observable, of } from 'rxjs';

export function letterValidator(
  control: AbstractControl<string | undefined | null>,
): ValidationErrors | null {
  const value = control.value;
  if (value?.toLowerCase().includes('a')) {
    return null;
  }
  return { letter: { value } };
}

export function asyncValidator(
  control: AbstractControl<string | undefined | null>,
): Observable<ValidationErrors | null> {
  const value = control.value;
  if (value?.toLowerCase().includes('async')) {
    return of(null);
  }
  return of({ async: { value } });
}
