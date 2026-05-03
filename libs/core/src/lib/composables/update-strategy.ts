import { computed, inject, Signal } from '@angular/core';
import { NgxFbAbstractControl, UpdateStrategy } from '../types/content.type';
import { NGX_FW_DEFAULT_UPDATE_STRATEGY } from '../tokens/default-update-strategy';
import { NGX_FW_PARENT_CONTEXT } from '../tokens/parent-context';
import { resolveUpdateStrategy } from './resolve-update-strategy';

/**
 * Resolves the control's update strategy. The strategy controls when form
 * values and validation run: `'change'` on every change event (Angular
 * default), `'blur'` when the control loses focus, or `'submit'` only on
 * form submission.
 *
 * Resolution order:
 * 1. The control's own `updateOn`.
 * 2. The parent group's update strategy via {@link NGX_FW_PARENT_CONTEXT}.
 * 3. The application default.
 *
 * @param content Signal of the control's content config, read for the
 *   optional `updateOn` field.
 * @returns A signal of the resolved `UpdateStrategy`.
 */
export function withUpdateStrategy(
  content: Signal<NgxFbAbstractControl>,
): Signal<UpdateStrategy> {
  const parent = inject(NGX_FW_PARENT_CONTEXT, {
    optional: true,
    skipSelf: true,
  });

  const defaultUpdateStrategy = inject(NGX_FW_DEFAULT_UPDATE_STRATEGY);

  return resolveUpdateStrategy(
    computed(() => content().updateOn),
    computed(() => parent?.updateStrategy()),
    defaultUpdateStrategy,
  );
}
