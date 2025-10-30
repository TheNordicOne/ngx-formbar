import { computed, inject, Signal } from '@angular/core';
import { TestIdBuilderFn } from '../types/functions.type';
import { NgxFbBaseContent, NgxFbFormGroup } from '../types/content.type';
import { NgxfbGroupDirective } from '../directives/ngxfb-group.directive';
import { NgxFbConfigurationService } from '../services/configuration.service';

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
  const globalTestIdBuilder = globalConfig.testIdBuilder;

  return computed(() => {
    const contentValue = content();
    const id = name();
    const parentGroupTestId = parentGroupDirective?.testId();
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
