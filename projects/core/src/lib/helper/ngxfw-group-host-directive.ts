import { NgxfwGroupDirective } from '../directives/ngxfw-group.directive';

/**
 * Configuration for exposing NgxfwGroupDirective in standalone components
 *
 * This object provides a standardized way to include the NgxfwGroupDirective
 * in Angular standalone components using the hostDirectives feature.
 *
 * @property directive - Reference to the NgxfwGroupDirective class
 * @property inputs - Array of input properties to expose from the directive
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-custom-group',
 *   standalone: true,
 *   template: '...',
 *   hostDirectives: [ngxfwGroupHostDirective]
 * })
 * export class CustomGroupComponent {
 *   // The component now has access to the NgxfwGroupDirective functionality
 *   // with the 'content' input exposed automatically
 * }
 */
export const ngxfwGroupHostDirective = {
  directive: NgxfwGroupDirective,
  inputs: ['content', 'name'],
};
