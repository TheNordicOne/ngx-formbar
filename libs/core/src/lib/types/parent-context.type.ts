import { Signal } from '@angular/core';
import { HideStrategy, ValueStrategy } from './content.type';
import { UpdateStrategy } from './content.type';

/**
 * Contract a parent group must satisfy so its descendants can inherit state
 * and inheritable directive options. An integration package provides an
 * implementation through {@link NGX_FW_PARENT_CONTEXT}; child composables
 * read whichever signals they need.
 *
 * Implementations may return sentinel values (`false`, empty string,
 * `undefined`) when the integration has no concept of a particular field.
 */
export interface NgxFwParentContext {
  readonly isHidden: Signal<boolean>;
  readonly isDisabled: Signal<boolean>;
  readonly isReadonly: Signal<boolean>;
  readonly testId: Signal<string>;
  readonly hideStrategy: Signal<HideStrategy | undefined>;
  readonly valueStrategy: Signal<ValueStrategy | undefined>;
  readonly updateStrategy: Signal<UpdateStrategy>;
}
