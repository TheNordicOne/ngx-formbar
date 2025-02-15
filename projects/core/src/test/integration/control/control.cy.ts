import { formworkProviders } from '../shared/provide-formwork';
import { ControlIntegrationHostComponent } from './integration-host/control-integration-host.component';

describe('Control', () => {
  describe('content', () => {
    it('should have access to all properties specific to the control type', () => {
      cy.mount(ControlIntegrationHostComponent, {
        providers: [formworkProviders],
        componentProperties: {
          content: {
            id: 'first',
            type: 'test-text-control',
            label: 'First label',
            hint: 'This is a hint',
            defaultValue: 'First Default',
          },
        },
      });

      cy.getByTestId('control-first').should('exist');
      cy.getByTestId('control-first-label').should('have.text', 'First label');
      cy.getByTestId('control-first-hint').should(
        'have.text',
        'This is a hint',
      );
    });
  });
});
