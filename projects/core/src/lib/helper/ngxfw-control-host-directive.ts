/**
 * Configuration for exposing NgxfbControlDirective in standalone components
 *
 * This object provides a standardized way to include the NgxfbControlDirective
 * in Angular standalone components using the hostDirectives feature.
 *
 * @property directive - Reference to the NgxfbControlDirective class
 * @property inputs - Array of input properties to expose from the directive
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-custom-control',
 *   standalone: true,
 *   template: '...',
 *   hostDirectives: [ngxfbControlHostDirective]
 * })
 * export class CustomControlComponent {
 *   // The component now has access to the NgxfbControlDirective functionality
 *   // with the 'content' input exposed automatically
 * }
 */
export const ngxfbControlHostDirective = {
  directive: NgxfbControlDirective,
  inputs: ['content', 'name'],
};
