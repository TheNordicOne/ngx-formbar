import { computed, Signal } from '@angular/core';
import { NgxFwContent } from 'core';

/**
 * Creates a computed signal that extracts the ID for testing purposes
 *
 * This utility function derives a test identifier from a form control's content,
 * which can be used for targeting elements in automated tests.
 *
 * @template T - Type extending NgxFwContent
 * @param content - Signal containing the control or group content configuration
 * @returns Computed signal that resolves to the element's ID for testing
 */
export function withTestId(content: Signal<NgxFwContent>) {
  return computed(() => content().id);
}
