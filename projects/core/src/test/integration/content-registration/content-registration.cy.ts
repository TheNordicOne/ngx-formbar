import { RegistrationIntegrationHostComponent } from './integration-host/registration-integration-host.component';
import { dummyControlContainer } from '../shared/control-container';

describe('Content Registration', () => {
  it('should show registered content', () => {
    cy.mount(RegistrationIntegrationHostComponent, {
      providers: [formbarProviders(), dummyControlContainer],
      componentProperties: {
        name: 'control',
        content: {
          type: 'test-text-control',
          label: 'Test',
        },
      },
    });

    cy.getByTestId('control').should('exist');
  });
});
