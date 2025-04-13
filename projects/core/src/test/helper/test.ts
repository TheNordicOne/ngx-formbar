import { NgxFwContent, UpdateStrategy } from '../../lib';
import { FormIntegrationHostComponent } from '../integration/form/integration-host/form-integration-host.component';
import { formworkProviders } from '../integration/shared/provide-formwork';

/**
 * Base setup function for mounting the form component
 */
export function setupForm(
  formContent: NgxFwContent[],
  options?: { defaultUpdateOnStrategy?: UpdateStrategy; autoUpdate?: boolean },
) {
  cy.mount(FormIntegrationHostComponent, {
    providers: [formworkProviders(options?.defaultUpdateOnStrategy)],
    componentProperties: {
      formContent,
      autoUpdate: options?.autoUpdate,
    },
  });
}
