import { Directive, inject, input, signal } from '@angular/core';
import { NgxFwBaseContent } from '../types/content.type';
import { ControlContainer } from '@angular/forms';
import { withTestId } from '../composables/testId';
import {
  withHiddenAttribute,
  withHiddenState,
} from '../composables/hidden.state';
import { StateHandling } from '../types/registration.type';
import { TestIdBuilderFn } from '../types/functions.type';

/**
 * Block Directive for Ngx Formwork
 *
 * This directive manages a block of content within Ngx Formwork, handling:
 * - Visibility states and DOM representation
 * - Test ID computation for automated testing
 * - Access to the parent form container
 *
 * The directive automatically:
 * - Evaluates conditions for hidden states
 * - Manages the block's visibility in the DOM
 *
 * @template T Type extending NgxFwBaseContent containing block configuration
 */
@Directive({
  selector: '[ngxfwNgxfwBlock]',
  host: {
    '[attr.hidden]': 'hiddenAttribute()',
  },
})
export class NgxfwBlockDirective<T extends NgxFwBaseContent> {
  /**
   * Reference to the parent form container.
   */
  private parentContainer = inject(ControlContainer);

  /**
   * Required input containing the block configuration.
   */
  readonly content = input.required<T>();

  /**
   * Signal for managing the visibility handling strategy ('auto' or 'manual').
   */
  private readonly visibilityHandling = signal<StateHandling>('auto');

  private readonly testIdBuilder = signal<TestIdBuilderFn | undefined>(
    undefined,
  );

  /**
   * Computed test ID derived from the block's ID.
   * Used for automated testing identification.
   */
  readonly testId = withTestId(this.content, this.testIdBuilder);

  /**
   * Computed signal for the hidden state.
   * True when the block should be hidden.
   */
  readonly isHidden = withHiddenState(this.content);

  /**
   * Computed signal for the hidden attribute.
   * Used in DOM binding to show/hide the block element.
   */
  readonly hiddenAttribute = withHiddenAttribute({
    hiddenSignal: this.isHidden,
    hiddenHandlingSignal: this.visibilityHandling,
  });

  /**
   * Returns the parent form container.
   */
  get rootForm() {
    return this.parentContainer;
  }

  /**
   * Sets the visibility handling strategy.
   * Determines if visibility should be managed by the component (manual) or by Formwork (auto).
   *
   * @param visibilityHandling Strategy for handling visibility ('auto' or 'manual')
   */
  setVisibilityHandling(visibilityHandling: StateHandling) {
    this.visibilityHandling.set(visibilityHandling);
  }

  /**
   * Sets the function to use for building a test id.
   *
   * @param builderFn Function that returns the test id
   */
  setTestIdBuilderFn(builderFn: TestIdBuilderFn | undefined) {
    this.testIdBuilder.set(builderFn);
  }
}
