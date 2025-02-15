import { RegistrationIntegrationHostComponent } from './integration-host/registration-integration-host.component';
import { formworkProviders } from '../shared/provide-formwork';

describe('Content Registration', () => {
  it('should show registered content', () => {
    cy.mount(RegistrationIntegrationHostComponent, {
      providers: [formworkProviders],
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
