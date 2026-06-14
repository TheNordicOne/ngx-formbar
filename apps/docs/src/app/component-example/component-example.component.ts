import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Wraps a live demo render in a bordered container that matches the ng-doc
 * demo look. Used so the component examples render in a proper container
 * instead of floating in the page. The source code is shown classically
 * below the demo, outside this component.
 */
@Component({
  selector: 'docs-component-example',
  templateUrl: './component-example.component.html',
  styleUrl: './component-example.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentExampleComponent {}
