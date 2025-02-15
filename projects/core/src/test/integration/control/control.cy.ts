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

      cy.getByTestId('first').should('exist');
      cy.getByTestId('first-label').should('have.text', 'First label');
      cy.getByTestId('first-hint').should('have.text', 'This is a hint');

      cy.getByTestId('first-input').should('have.value', 'First Default');
    });

    it('should work without default value', () => {
      cy.mount(ControlIntegrationHostComponent, {
        providers: [formworkProviders],
        componentProperties: {
          content: {
            id: 'first',
            type: 'test-text-control',
            label: 'First label',
            hint: 'This is a hint',
          },
        },
      });

      cy.getByTestId('first').should('exist');
      cy.getByTestId('first-label').should('have.text', 'First label');
      cy.getByTestId('first-hint').should('have.text', 'This is a hint');

      cy.getByTestId('first-input').should('have.value', '');
    });
  });
});
