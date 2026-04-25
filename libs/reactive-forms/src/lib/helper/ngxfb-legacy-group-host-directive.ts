import { NgxfbLegacyGroupDirective } from '../directives/ngxfb-legacy-group.directive';

/**
 * Configuration for exposing NgxfbLegacyGroupDirective in standalone components
 *
 * This object provides a standardized way to include the NgxfbLegacyGroupDirective
 * in Angular standalone components using the hostDirectives feature.
 *
 * @property directive - Reference to the NgxfbLegacyGroupDirective class
 * @property inputs - Array of input properties to expose from the directive
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-custom-group',
 *   standalone: true,
 *   template: '...',
 *   hostDirectives: [ngxfbLegacyGroupHostDirective]
 * })
 * export class CustomGroupComponent {
 *   // The component now has access to the NgxfbLegacyGroupDirective functionality
 *   // with the 'content' and 'name' inputs exposed automatically
 * }
 */
export const ngxfbLegacyGroupHostDirective = {
  directive: NgxfbLegacyGroupDirective,
  inputs: ['content', 'name'],
};
