import { NgxFwContent, OneOf, UpdateStrategy } from '../../lib';
import { FormIntegrationHostComponent } from '../integration/form/integration-host/form-integration-host.component';
import { formworkProviders } from '../integration/shared/provide-formwork';
import { TestTextControl } from '../types/controls.type';
import { TestGroup } from '../types/group.type';
import { InfoBlock } from '../types/block.type';

/**
 * Base setup function for mounting the form component
 */
export function setupForm(
  formContent: OneOf<[TestTextControl, TestGroup, InfoBlock]>[],
  options?: {
    defaultUpdateOnStrategy?: UpdateStrategy;
    autoUpdate?: boolean;
    useDefaultTestIds: boolean;
  },
) {
  cy.mount(FormIntegrationHostComponent, {
    providers: [formworkProviders(options?.defaultUpdateOnStrategy)],
    componentProperties: {
      formContent: formContent as NgxFwContent[],
      autoUpdate: options?.autoUpdate,
      useDefaultTestIds: options?.useDefaultTestIds,
    },
  });
}
