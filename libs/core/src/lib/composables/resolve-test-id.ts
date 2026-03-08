import { computed, Signal } from '@angular/core';
import { NgxFbBaseContent } from '../types/content.type';
import { TestIdBuilderFn } from '../types/functions.type';

/**
 * Resolves a test ID for a form element
 *
 * The test ID is determined using the following priority:
 * 1. A local testIdBuilder function if provided
 * 2. A global testIdBuilder function if provided
 * 3. Default: joins parentTestId and name with '-', or just name if no parent
 *
 * @param content Signal containing the base content configuration
 * @param name Signal containing the control/group name
 * @param testIdBuilder Signal holding an optional local testIdBuilder function
 * @param globalTestIdBuilder Optional global testIdBuilder function from configuration
 * @param parentTestId Signal providing the parent group's test ID
 * @returns Computed signal that resolves to the test ID string
 */
export function resolveTestId(
  content: Signal<NgxFbBaseContent>,
  name: Signal<string>,
  testIdBuilder: Signal<TestIdBuilderFn | undefined>,
  globalTestIdBuilder: TestIdBuilderFn | undefined,
  parentTestId: Signal<string | undefined>,
) {
  return computed(() => {
    const contentValue = content();
    const id = name();
    const parentGroupTestId = parentTestId();
    const builderFn = testIdBuilder();

    if (builderFn) {
      return builderFn(contentValue, id, parentGroupTestId);
    }

    if (globalTestIdBuilder) {
      return globalTestIdBuilder(contentValue, id, parentGroupTestId);
    }

    if (!parentGroupTestId) {
      return id;
    }
    return [parentGroupTestId, id].join('-');
  });
}
