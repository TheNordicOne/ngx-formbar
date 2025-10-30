import { Directive, inject, input, signal } from '@angular/core';
import { ControlContainer } from '@angular/forms';
import { withTestId } from '../composables/testId';
import {
  withHiddenAttribute,
  withHiddenState,
} from '../composables/hidden.state';
import { StateHandling } from '../types/registration.type';
import { TestIdBuilderFn } from '../types/functions.type';
import { NgxFbBaseContent } from '../types/content.type';

/**
 * Core directive for non-form elements that appear in forms.
 *
 * Block elements represent UI components that don't contribute to the form's value
 * but provide information or functionality within forms, such as:
 * - Information blocks
 * - Images
 * - Dividers
 * - Help text
 * - Custom UI elements
 *
 * This directive handles visibility conditions and test ID generation for block elements.
 *
 * Use this directive with hostDirectives in your custom block components:
 *
 * ```typescript
 * @Component({
 *   hostDirectives: [
 *     {
 *       directive: NgxfbBlockDirective,
 *       inputs: ['content', 'name'],
 *     }
 *   ],
 * })
 * export class InfoBlockComponent {
 *   private readonly blockDirective = inject(NgxfbBlockDirective<InfoBlock>);
 *   readonly content = this.blockDirective.content;
 *   readonly message = computed(() => this.content().message);
 * }
 * ```
 *
 * @template T Type of the block configuration, must extend NgxFbBaseContent
 */
@Directive({
  selector: '[ngxfbBlock]',
  host: {
    '[attr.hidden]': 'hiddenAttribute()',
  },
})
export class NgxfbBlockDirective<T extends NgxFbBaseContent> {
  /**
   * Reference to the parent form container.
   * Provides access to the form that contains this block.
   */
  private parentContainer = inject(ControlContainer);

  /**
   * Required input containing the block configuration.
   * Defines properties like type, hidden condition, and custom properties.
   */
  readonly content = input.required<T>();

  /**
   * Required input for the block's name.
   * Used as an identifier within the form.
   */
  readonly name = input.required<string>();

  /**
   * Signal for managing the visibility handling strategy ('auto' or 'manual').
   * - 'auto': directive handles visibility via hidden attribute
   * - 'manual': component handles visibility in its own template
   */
  private readonly visibilityHandling = signal<StateHandling>('auto');

  /**
   * Signal for the test ID builder function.
   * Used to customize how test IDs are generated.
   */
  private readonly testIdBuilder = signal<TestIdBuilderFn | undefined>(
    undefined,
  );

  /**
   * Computed test ID derived from the block's name.
   * Used for automated testing identification.
   *
   * Access this in your component template:
   * ```html
   * <div [attr.data-testid]="testId()">...</div>
   * ```
   */
  readonly testId = withTestId(this.content, this.name, this.testIdBuilder);

  /**
   * Computed signal for the hidden state.
   * True when the block should be hidden based on 'hidden' expression.
   *
   * Use this in your component when implementing custom visibility handling:
   * ```typescript
   * readonly isHidden = this.blockDirective.isHidden;
   * ```
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
   * Provides access to the form instance that contains this block.
   *
   * Use this to access form data or methods:
   * ```typescript
   * const formData = this.blockDirective.rootForm.control.value;
   * ```
   */
  get rootForm() {
    return this.parentContainer;
  }

  /**
   * Sets the visibility handling strategy.
   * Determines if visibility should be managed by the component (manual) or by Formbar (auto).
   *
   * Use 'manual' when implementing custom visibility handling in your component:
   * ```typescript
   * constructor() {
   *   this.blockDirective.setVisibilityHandling('manual');
   * }
   * ```
   *
   * @param visibilityHandling Strategy for handling visibility ('auto' or 'manual')
   */
  setVisibilityHandling(visibilityHandling: StateHandling) {
    this.visibilityHandling.set(visibilityHandling);
  }

  /**
   * Sets the function to use for building a test id.
   * This allows custom test ID generation strategies to be used.
   *
   * @param builderFn Function that returns the test id
   */
  setTestIdBuilderFn(builderFn: TestIdBuilderFn | undefined) {
    this.testIdBuilder.set(builderFn);
  }
}
