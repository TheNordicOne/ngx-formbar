import { formworkProviders } from '../shared/provide-formwork';
import { GroupIntegrationHostComponent } from './integration-host/group-integration-host.component';

describe('Group', () => {
  describe('content', () => {
    it('should have access to all properties specific to the group type and render all content', () => {
      cy.mount(GroupIntegrationHostComponent, {
        providers: [formworkProviders],
        componentProperties: {
          content: {
            type: 'test-group',
            id: 'test-group',
            title: 'First Group',
            controls: [
              {
                id: 'first',
                type: 'test-text-control',
                label: 'First label',
              },
              {
                type: 'test-group',
                id: 'nested-group',
                title: 'Nested Group',
                controls: [
                  {
                    id: 'second',
                    type: 'test-text-control',
                    label: 'Second label',
                  },
                ],
              },
            ],
          },
        },
      });
      cy.getByTestId('test-group').should('exist');
      cy.getByTestId('test-group-title').should('have.text', 'First Group');

      cy.getByTestId('first').should('exist');

      cy.getByTestId('nested-group').should('exist');
      cy.getByTestId('nested-group-title').should('have.text', 'Nested Group');

      cy.getByTestId('second').should('exist');
    });
  });

  describe('validation', () => {
    it('should use multiple validators (custom, async)', () => {
      cy.mount(GroupIntegrationHostComponent, {
        providers: [formworkProviders],
        componentProperties: {
          content: {
            type: 'test-group',
            id: 'test-group',
            title: 'First Group',
            controls: [
              {
                id: 'first',
                type: 'test-text-control',
                label: 'First label',
              },
              {
                id: 'second',
                type: 'test-text-control',
                label: 'Second label',
              },
            ],
            validators: ['no-duplicates', 'forbidden-letter-a'],
            asyncValidators: ['async-group'],
          },
        },
      });
      cy.getByTestId('first-input').as('firstInput');
      cy.getByTestId('second-input').as('secondInput');

      cy.get('@firstInput').type('X');
      cy.get('@secondInput').type('X');
      cy.get('@secondInput').blur();

      cy.getByTestId('test-group-validation-error-no-duplicates').should(
        'contain.text',
        'No duplicate values',
      );

      cy.get('@firstInput').clear();
      cy.get('@firstInput').blur();

      cy.getByTestId('test-group-validation-error-async').should(
        'contain.text',
        'async',
      );

      cy.get('@firstInput').type('A');

      cy.getByTestId('test-group-validation-error-forbidden-letter-a').should(
        'contain.text',
        'The letter A is not allowed',
      );
    });
  });
});
