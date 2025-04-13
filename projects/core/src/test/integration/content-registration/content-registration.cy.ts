import { RegistrationIntegrationHostComponent } from './integration-host/registration-integration-host.component';
import { formworkProviders } from '../shared/provide-formwork';
import { dummyControlContainer } from '../shared/control-container';

describe('Content Registration', () => {
  it('should show registered content', () => {
    cy.mount(RegistrationIntegrationHostComponent, {
      providers: [formworkProviders(), dummyControlContainer],
      componentProperties: {
        content: {
          type: 'test-text-control',
          id: 'control',
          label: 'Test',
        },
      },
    });

    cy.getByTestId('control').should('exist');
  });
});
