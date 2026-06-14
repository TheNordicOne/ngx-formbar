import {
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { getByPath, isEmpty, toNumber } from '@ngx-formbar/examples';

// ---------------------------------------------------------------------------
// Numeric validators
// ---------------------------------------------------------------------------
export function integer(c: AbstractControl): ValidationErrors | null {
  const v: unknown = c.value;
  if (isEmpty(v)) {
    return null;
  }
  const n = toNumber(v);
  if (!Number.isFinite(n)) {
    return { integer: true };
  }
  if (!Number.isInteger(n)) {
    return { integer: true };
  }
  return null;
}

export function min0(c: AbstractControl): ValidationErrors | null {
  const v: unknown = c.value;
  if (isEmpty(v)) {
    return null;
  }
  const n = toNumber(v);
  if (!Number.isFinite(n)) {
    return { min0: true };
  }
  if (n < 0) {
    return { min0: true };
  }
  return null;
}

export function range1to10(c: AbstractControl): ValidationErrors | null {
  const v: unknown = c.value;
  if (isEmpty(v)) {
    return null;
  }
  const n = toNumber(v);
  if (!Number.isFinite(n)) {
    return { range: 'Must be between 1 and 10' };
  }
  if (n < 1 || n > 10) {
    return { range: 'Must be between 1 and 10' };
  }
  return null;
}

export function range1to480(c: AbstractControl): ValidationErrors | null {
  const v: unknown = c.value;
  if (isEmpty(v)) {
    return null;
  }
  const n = toNumber(v);
  if (!Number.isFinite(n)) {
    return { range: 'Must be between 1 and 480' };
  }
  if (n < 1 || n > 480) {
    return { range: 'Must be between 1 and 480' };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Length validators
// ---------------------------------------------------------------------------
export function minLen(len: number): ValidatorFn {
  return (c: AbstractControl) => {
    const v = c.value as unknown;
    if (isEmpty(v)) {
      return null;
    }
    if (typeof v !== 'string') {
      return { minlength: { requiredLength: len, actualLength: 0 } };
    }
    if (v.length < len) {
      return { minlength: { requiredLength: len, actualLength: v.length } };
    }
    return null;
  };
}

// ---------------------------------------------------------------------------
// File validators
// ---------------------------------------------------------------------------
export function maxFiles5(c: AbstractControl): ValidationErrors | null {
  const files = toFiles(c.value);
  if (files.length === 0) {
    return null;
  }
  return files.length > 5 ? { maxFiles5: true } : null;
}

export function imagesOrPdf(c: AbstractControl): ValidationErrors | null {
  const files = toFiles(c.value);
  if (files.length === 0) {
    return null;
  }
  const allValid = files.every(
    (f) => f.type.startsWith('image/') || f.type === 'application/pdf',
  );
  return allValid ? null : { imagesOrPdf: true };
}

function toFiles(value: unknown): File[] {
  if (isEmpty(value)) {
    return [];
  }
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is File => item instanceof File);
}

// ---------------------------------------------------------------------------
// Pattern/format validators
// ---------------------------------------------------------------------------
export function floorPattern(c: AbstractControl): ValidationErrors | null {
  const v = c.value as unknown;
  if (isEmpty(v)) {
    return null;
  }
  if (typeof v !== 'string') {
    return { floorPattern: true };
  }
  return /^(B\d+|G|[0-9]+)$/u.test(v) ? null : { floorPattern: true };
}

export function alnumDash(c: AbstractControl): ValidationErrors | null {
  const v = c.value as unknown;
  if (isEmpty(v)) {
    return null;
  }
  if (typeof v !== 'string') {
    return { alnumDash: true };
  }
  return /^[A-Za-z0-9-]+$/u.test(v) ? null : { alnumDash: true };
}

export function circuitPattern(c: AbstractControl): ValidationErrors | null {
  const v = c.value as unknown;
  if (isEmpty(v)) {
    return null;
  }
  if (typeof v !== 'string') {
    return { circuitPattern: true };
  }
  return /^P\d+-C\d+$/u.test(v) ? null : { circuitPattern: true };
}

export function isoDate(c: AbstractControl): ValidationErrors | null {
  const v = c.value as unknown;
  if (isEmpty(v)) {
    return null;
  }
  if (typeof v !== 'string') {
    return { isoDate: true };
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) {
    return { isoDate: true };
  }
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);

  if (mo < 1 || mo > 12) {
    return { isoDate: true };
  }
  if (d < 1 || d > 31) {
    return { isoDate: true };
  }

  const date = new Date(v + 'T00:00:00Z');
  if (Number.isNaN(date.getTime())) {
    return { isoDate: true };
  }

  const utcY = date.getUTCFullYear();
  const utcM = date.getUTCMonth() + 1;
  const utcD = date.getUTCDate();

  if (utcY !== y) {
    return { isoDate: true };
  }
  if (utcM !== mo) {
    return { isoDate: true };
  }
  if (utcD !== d) {
    return { isoDate: true };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Conditional requireds
// ---------------------------------------------------------------------------
export function requiredWhenVisible(
  c: AbstractControl,
): ValidationErrors | null {
  return Validators.required(c);
}

export function requiredWhenCritical(
  c: AbstractControl,
): ValidationErrors | null {
  const urgencyCtrl = getByPath(c, 'details.urgency');
  const urgency: unknown = urgencyCtrl ? urgencyCtrl.value : undefined;
  if (urgency !== 'critical') {
    return null;
  }
  return isEmpty(c.value) ? { requiredWhenCritical: true } : null;
}

export function requiredWhenCriticalOrNeeded(
  c: AbstractControl,
): ValidationErrors | null {
  const urgencyCtrl = getByPath(c, 'details.urgency');
  const needsManagerCtrl = getByPath(c, 'approvals.needsManager');

  const urgency: unknown = urgencyCtrl ? urgencyCtrl.value : undefined;
  const needsManager = needsManagerCtrl
    ? (needsManagerCtrl.value as unknown) === true
    : false;

  if (urgency === 'critical' || needsManager) {
    return isEmpty(c.value as unknown)
      ? { requiredWhenCriticalOrNeeded: true }
      : null;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Test validators (from reactive-forms test suite)
// ---------------------------------------------------------------------------
export function letterValidator(
  control: AbstractControl<string | undefined | null>,
): ValidationErrors | null {
  const value = control.value;
  if (containsText(value, 'a')) {
    return null;
  }
  return { letter: 'Must contain the letter "a"' };
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

  return duplicates.length > 0
    ? { duplicates: 'No duplicate values allowed' }
    : null;
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
    return includesA
      ? { forbiddenLetterA: 'The letter "A" is not allowed' }
      : null;
  }

  const values = Object.values(value);
  const someValueIncludesA = values.some((v) => containsText(v, 'a'));
  return someValueIncludesA
    ? { forbiddenLetterA: 'The letter "A" is not allowed' }
    : null;
}

export function minRows(min: number): ValidatorFn {
  return (c: AbstractControl) => {
    const value = c.value as unknown;
    const length = Array.isArray(value) ? value.length : 0;
    return length < min
      ? { minRows: `At least ${String(min)} rows required` }
      : null;
  };
}

function containsText(value: unknown, text: string) {
  if (typeof value !== 'string') {
    return false;
  }
  return value.toLowerCase().includes(text);
}
