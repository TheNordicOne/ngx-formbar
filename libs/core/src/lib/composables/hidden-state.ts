import { computed, inject, Signal } from '@angular/core';
import { NgxFbBaseContent } from '../types/content.type';
import { NGX_FW_FORM_VALUE } from '../tokens/form-value';
import { NGX_FW_PARENT_CONTEXT } from '../tokens/parent-context';
import { resolveHiddenState } from './resolve-hidden-state';

/**
 * Resolves the reactive hidden state for an element, combining the local
 * `hidden` expression with the enclosing parent's hidden state via the
 * {@link NGX_FW_PARENT_CONTEXT} token.
 *
 * @param content Signal of the element's content config. The `hidden` field
 *   may be a boolean, expression string, or predicate function.
 * @returns A signal of the resolved boolean hidden state.
 */
export function withHiddenState(
  content: Signal<NgxFbBaseContent>,
): Signal<boolean> {
  const formValue = inject(NGX_FW_FORM_VALUE);
  const parent = inject(NGX_FW_PARENT_CONTEXT, {
    optional: true,
    skipSelf: true,
  });

  const option = computed(() => content().hidden);
  const parentIsHidden = computed<boolean>(() =>
    parent ? parent.isHidden() : false,
  );

  return resolveHiddenState(option, formValue, parentIsHidden);
}
