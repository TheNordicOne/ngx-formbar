import { computed, Signal } from '@angular/core';
import { NgxFbBaseContent } from '../types/content.type';
import { TestIdBuilderFn } from '../types/functions.type';

/**
 * Resolves a test ID for a form element.
 *
 * Uses the global `testIdBuilder` when provided. Otherwise joins the parent
 * test ID and name with `-`, or returns just the name when there is no parent.
 *
 * @param content Signal carrying the content configuration. Forwarded to a
 *   custom builder so it can branch on the content type.
 * @param name Signal carrying the control or group name.
 * @param globalTestIdBuilder Optional builder supplied through library
 *   configuration. When set it fully owns ID generation.
 * @param parentTestId Signal exposing the parent group's resolved test ID.
 *   `undefined` at the top of the form.
 * @returns Computed signal that resolves to the test ID string used for
 *   `data-testid` bindings.
 */
export function resolveTestId(
  content: Signal<NgxFbBaseContent>,
  name: Signal<string>,
  globalTestIdBuilder: TestIdBuilderFn | undefined,
  parentTestId: Signal<string | undefined>,
) {
  return computed(() => {
    const contentValue = content();
    const id = name();
    const parentGroupTestId = parentTestId();

    if (globalTestIdBuilder) {
      return globalTestIdBuilder(contentValue, id, parentGroupTestId);
    }

    if (!parentGroupTestId) {
      return id;
    }
    return [parentGroupTestId, id].join('-');
  });
}
