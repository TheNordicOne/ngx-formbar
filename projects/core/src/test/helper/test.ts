import { NgxFbForm, TestIdBuilderFn, UpdateStrategy } from '../../lib';
import { FormIntegrationHostComponent } from '../integration/form/integration-host/form-integration-host.component';
import { TestTextControl } from '../types/controls.type';
import { TestGroup } from '../types/group.type';
import { InfoBlock } from '../types/block.type';
import { formbarProviders } from '../integration/shared/provide-formwork';

export type TestContent = TestTextControl | TestGroup | InfoBlock;
/**
 * Base setup function for mounting the form component
 */
export function setupForm(
  form: NgxFbForm<TestContent>,
  options?: {
    defaultUpdateOnStrategy?: UpdateStrategy;
    autoUpdate?: boolean;
    testIdBuilderFn?: TestIdBuilderFn;
  },
) {
  cy.mount(FormIntegrationHostComponent, {
    providers: [
      formbarProviders(
        options?.defaultUpdateOnStrategy,
        options?.testIdBuilderFn,
      ),
    ],
    componentProperties: {
      formConfig: form as NgxFbForm,
      autoUpdate: options?.autoUpdate,
    },
  });
}
