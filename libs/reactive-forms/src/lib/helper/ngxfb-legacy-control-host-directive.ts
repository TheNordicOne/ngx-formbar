import { NgxfbLegacyControlDirective } from '../directives/ngxfb-legacy-control.directive';

/**
 * Configuration for exposing NgxfbLegacyControlDirective in standalone components
 *
 * This object provides a standardized way to include the NgxfbLegacyControlDirective
 * in Angular standalone components using the hostDirectives feature.
 *
 * @property directive - Reference to the NgxfbLegacyControlDirective class
 * @property inputs - Array of input properties to expose from the directive
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-custom-control',
 *   standalone: true,
 *   template: '...',
 *   hostDirectives: [ngxfbLegacyControlHostDirective]
 * })
 * export class CustomControlComponent {
 *   // The component now has access to the NgxfbLegacyControlDirective functionality
 *   // with the 'content' and 'name' inputs exposed automatically
 * }
 */
export const ngxfbLegacyControlHostDirective = {
  directive: NgxfbLegacyControlDirective,
  inputs: ['content', 'name'],
};
