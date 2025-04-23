import { NgxfwControlDirective } from '../directives/ngxfw-control.directive';

/**
 * Configuration for exposing NgxfwControlDirective in standalone components
 *
 * This function provides a standardized way to include the NgxfwControlDirective
 * in Angular standalone components using the hostDirectives feature.
 *
 * @property directive - Reference to the NgxfwControlDirective class
 * @property inputs - Array of input properties to expose from the directive
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-custom-control',
 *   standalone: true,
 *   template: '...',
 *   hostDirectives: [{...withNgxFwControl()}]
 * })
 * export class CustomControlComponent {
 *   // The component now has access to the NgxfwControlDirective functionality
 *   // with the 'content' input exposed automatically
 * }
 */
export function withNgxFwControl() {
  return {
    directive: NgxfwControlDirective,
    inputs: ['content'],
  };
}
