import { OneOf, UpdateStrategy } from '../../lib';
import { FormIntegrationHostComponent } from '../integration/form/integration-host/form-integration-host.component';
import { formworkProviders } from '../integration/shared/provide-formwork';
import { TestTextControl } from '../types/controls.type';
import { TestGroup } from '../types/group.type';
import { InfoBlock } from '../types/block.type';
import { TestIdBuilderFn } from '../../lib/types/functions.type';
import { NgxFwForm } from '../../lib/types/form.type';

export type TestContent = OneOf<[TestTextControl, TestGroup, InfoBlock]>;
/**
 * Base setup function for mounting the form component
 */
export function setupForm(
  form: NgxFwForm<TestContent>,
  options?: {
    defaultUpdateOnStrategy?: UpdateStrategy;
    autoUpdate?: boolean;
    testIdBuilderFn?: TestIdBuilderFn;
  },
) {
  cy.mount(FormIntegrationHostComponent, {
    providers: [
      formworkProviders(
        options?.defaultUpdateOnStrategy,
        options?.testIdBuilderFn,
      ),
    ],
    componentProperties: {
      formConfig: form as NgxFwForm,
      autoUpdate: options?.autoUpdate,
    },
  });
}
