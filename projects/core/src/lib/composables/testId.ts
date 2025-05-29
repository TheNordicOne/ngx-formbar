import { computed, inject, Signal } from '@angular/core';
import { NgxFwBaseContent, NgxFwFormGroup } from '../types/content.type';
import { NgxfwGroupDirective } from '../directives/ngxfw-group.directive';
import { TestIdBuilderFn } from '../types/functions.type';
import { NgxFwConfigurationService } from '../services/configuration.service';

/**
 * Creates a computed signal that extracts the ID for testing purposes
 *
 * This utility function derives a test identifier from a form control's content,
 * which can be used for targeting elements in automated tests.
 *
 * @template T - Type extending NgxFwBaseContent
 * @param content - Signal containing the control or group content configuration
 * @param testIdBuilder - Signal holding a testIdBuilder function
 * @returns Computed signal that resolves to the element's ID for testing
 */
export function withTestId(
  content: Signal<NgxFwBaseContent>,
  testIdBuilder: Signal<TestIdBuilderFn | undefined>,
): Signal<string> {
  const parentGroupDirective: NgxfwGroupDirective<NgxFwFormGroup> | null =
    inject(NgxfwGroupDirective<NgxFwFormGroup>, {
      optional: true,
      skipSelf: true,
    });

  const globalConfig = inject(NgxFwConfigurationService);
  const globalTestIdBuilder = globalConfig.testIdBuilder;

  return computed(() => {
    const contentValue = content();
    const id = contentValue.id;
    const parentGroupTestId = parentGroupDirective?.testId();
    const builderFn = testIdBuilder();

    if (builderFn) {
      return builderFn(contentValue, parentGroupTestId);
    }

    if (globalTestIdBuilder) {
      return globalTestIdBuilder(contentValue, parentGroupTestId);
    }

    if (!parentGroupTestId) {
      return id;
    }
    return [parentGroupTestId, id].join('-');
  });
}
