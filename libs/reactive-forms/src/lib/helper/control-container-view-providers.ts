import { ControlContainer } from '@angular/forms';
import { inject } from '@angular/core';

/**
 * View providers that re-expose the parent `ControlContainer` to a
 * component's view, so nested form components inherit the parent form context
 * without passing `FormGroup` instances explicitly. Uses `skipSelf` to
 * resolve the container from an ancestor.
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-child-form',
 *   template: '...',
 *   viewProviders: [controlContainerViewProviders]
 * })
 * export class ChildFormComponent {
 *   private controlContainer = inject(ControlContainer);
 *
 *   get parentFormGroup() {
 *     return this.controlContainer.control as FormGroup | null;
 *   }
 * }
 * ```
 */
export const controlContainerViewProviders = [
  {
    provide: ControlContainer,
    useFactory: (): ControlContainer => inject(ControlContainer, { skipSelf: true }),
  },
];
