import { GroupIntegrationHostComponent } from './integration-host/group-integration-host.component';
import { dummyControlContainer } from '../shared/control-container';

describe('Group', () => {
  describe('content', () => {
    it('should have access to all properties specific to the group type and render all content', () => {
      cy.mount(GroupIntegrationHostComponent, {
        providers: [formbarProviders(), dummyControlContainer],
        componentProperties: {
          name: 'test-group',
          content: {
            type: 'test-group',
            title: 'First Group',
            controls: {
              first: {
                type: 'test-text-control',
                label: 'First label',
              },
              'nested-group': {
                type: 'test-group',
                title: 'Nested Group',
                controls: {
                  second: {
                    type: 'test-text-control',
                    label: 'Second label',
                  },
                },
              },
            },
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
        providers: [formbarProviders(), dummyControlContainer],
        componentProperties: {
          name: 'test-group',
          content: {
            type: 'test-group',
            title: 'First Group',
            controls: {
              first: {
                type: 'test-text-control',
                label: 'First label',
              },
              second: {
                type: 'test-text-control',
                label: 'Second label',
              },
            },
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
