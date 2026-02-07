import { NgxfbGroupDirective } from '../directives/ngxfb-group.directive';

/**
 * Configuration for exposing NgxfbGroupDirective in standalone components
 *
 * This object provides a standardized way to include the NgxfbGroupDirective
 * in Angular standalone components using the hostDirectives feature.
 *
 * @property directive - Reference to the NgxfbGroupDirective class
 * @property inputs - Array of input properties to expose from the directive
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-custom-group',
 *   standalone: true,
 *   template: '...',
 *   hostDirectives: [ngxfbGroupHostDirective]
 * })
 * export class CustomGroupComponent {
 *   // The component now has access to the NgxfbGroupDirective functionality
 *   // with the 'content' input exposed automatically
 * }
 */
export const ngxfbGroupHostDirective = {
  directive: NgxfbGroupDirective,
  inputs: ['content', 'name'],
};
