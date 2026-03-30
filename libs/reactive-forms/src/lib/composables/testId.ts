import { computed, inject, Signal } from '@angular/core';
import {
  TestIdBuilderFn,
  NgxFbBaseContent,
  NgxFbFormGroup,
  NgxFbConfigurationService,
  resolveTestId,
} from '@ngx-formbar/core';
import { NgxfbGroupDirective } from '../directives/ngxfb-group.directive';

/**
 * Creates a computed signal that extracts the ID for testing purposes
 *
 * This utility function derives a test identifier from a form control's content,
 * which can be used for targeting elements in automated tests.
 *
 * @template T - Type extending NgxFbBaseContent
 * @param content - Signal containing the control or group content configuration
 * @param name - Signal containing the name of the control
 * @param testIdBuilder - Signal holding a testIdBuilder function
 * @returns Computed signal that resolves to the element's ID for testing
 */
export function withTestId(
  content: Signal<NgxFbBaseContent>,
  name: Signal<string>,
  testIdBuilder: Signal<TestIdBuilderFn | undefined>,
): Signal<string> {
  const parentGroupDirective: NgxfbGroupDirective<NgxFbFormGroup> | null =
    inject(NgxfbGroupDirective<NgxFbFormGroup>, {
      optional: true,
      skipSelf: true,
    });

  const globalConfig = inject(NgxFbConfigurationService);

  return resolveTestId(
    content,
    name,
    testIdBuilder,
    globalConfig.testIdBuilder,
    computed(() => parentGroupDirective?.testId()),
  );
}
