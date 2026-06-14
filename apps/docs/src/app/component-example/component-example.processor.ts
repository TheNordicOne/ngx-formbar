import { NgDocPageProcessor } from '@ng-doc/app';
import { ComponentExampleComponent } from './component-example.component';

/**
 * Replaces `<docs-component-example>` markers in the rendered page with the
 * {@link ComponentExampleComponent}, projecting the marker's children (the
 * `[demo]` render and the `[code]` source tabs) into it.
 */
export const componentExampleProcessor: NgDocPageProcessor<ComponentExampleComponent> =
  {
    component: ComponentExampleComponent,
    selector: 'docs-component-example',
    extractOptions: (element: Element) => ({
      content: [Array.from(element.children)],
    }),
  };
