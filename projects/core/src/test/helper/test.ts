import { NgxFwContent } from '../../lib';
import { FormIntegrationHostComponent } from '../integration/form/integration-host/form-integration-host.component';
import { formworkProviders } from '../integration/shared/provide-formwork';

/**
 * Base setup function for mounting the form component
 */
export function setupForm(formContent: NgxFwContent[]) {
  cy.mount(FormIntegrationHostComponent, {
    providers: [formworkProviders],
    componentProperties: {
      formContent,
    },
  });
}
