import { ControlContainer } from '@angular/forms';
import { inject } from '@angular/core';

/**
 * Provides the parent ControlContainer to child components
 *
 * This provider configuration allows child form components to access their parent's
 * ControlContainer through dependency injection. This is particularly useful for
 * creating nested form components that inherit the parent form context without
 * explicitly passing FormGroup instances.
 *
 * @remarks
 * The `skipSelf` option ensures the provider looks for the ControlContainer in parent
 * components rather than trying to resolve it from the component where this is used.
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-child-form',
 *   template: '...',
 *   viewProviders: [controlContainerViewProviders]
 * })
 * export class ChildFormComponent {
 *   // Now this component can access the parent form
 *   private controlContainer = inject(ControlContainer);
 *
 *   get parentFormGroup() {
 *     return this.parentContainer.control as FormGroup | null;
 *   }
 * }
 */
export const controlContainerViewProviders = [
  {
    provide: ControlContainer,
    useFactory: () => inject(ControlContainer, { skipSelf: true }),
  },
];
