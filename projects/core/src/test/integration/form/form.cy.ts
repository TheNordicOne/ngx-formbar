// noinspection DuplicatedCode

import { FormIntegrationHostComponent } from './integration-host/form-integration-host.component';
import { formworkProviders } from '../shared/provide-formwork';

describe('Form', () => {
  describe('content', () => {
    beforeEach(() => {
      cy.mount(FormIntegrationHostComponent, {
        providers: [formworkProviders],
        componentProperties: {
          formContent: [
            {
              id: 'first',
              type: 'test-text-control',
              label: 'First',
              defaultValue: 'default-first',
            },
            {
              id: 'second',
              type: 'test-text-control',
              label: 'Second',
              defaultValue: 'default-second',
            },
            {
              id: 'third',
              type: 'test-text-control',
              label: 'Third',
              defaultValue: 'default-third',
            },
            {
              id: 'fourth',
              type: 'test-text-control',
              label: 'Fourth',
              defaultValue: 'default-fourth',
              nonNullable: true,
            },
            {
              id: 'fifth',
              type: 'test-text-control',
              label: 'Fifth',
              defaultValue: 'default-fifth',
              nonNullable: true,
            },
          ],
        },
      });
    });

    it('should show all content based on the form config', () => {
      cy.getByTestId('first-input').should('have.value', 'default-first');
      cy.getByTestId('second-input').should('have.value', 'default-second');
      cy.getByTestId('third-input').should('have.value', 'default-third');
      cy.getByTestId('fourth-input').should('have.value', 'default-fourth');
      cy.getByTestId('fifth-input').should('have.value', 'default-fifth');
    });

    it('should show default values, patch and reset values correctly', () => {
      cy.getByTestId('first-input').as('first');
      cy.getByTestId('second-input').as('second');
      cy.getByTestId('third-input').as('third');
      cy.getByTestId('fourth-input').as('fourth');
      cy.getByTestId('fifth-input').as('fifth');


      cy.get('@first').should('have.value', 'default-first');
      cy.get('@second').should('have.value', 'default-second');
      cy.get('@third').should('have.value', 'default-third');
      cy.get('@fourth').should('have.value', 'default-fourth');
      cy.get('@fifth').should('have.value', 'default-fifth');

      cy.getByTestId('patch').click();
      cy.get('@first').should('have.value', 'patched-first');
      cy.get('@second').should('have.value', 'patched-second');
      cy.get('@third').should('have.value', 'patched-third');
      cy.get('@fourth').should('have.value', 'patched-fourth');
      cy.get('@fifth').should('have.value', 'patched-fifth');

      cy.getByTestId('reset').click();
      cy.get('@first').should('have.value', '');
      cy.get('@second').should('have.value', '');
      cy.get('@third').should('have.value', '');
      cy.get('@fourth').should('have.value', 'default-fourth');
      cy.get('@fifth').should('have.value', 'default-fifth');
    });

    it('should have correct form values through submit action', () => {

      cy.getByTestId('first-input').as('first');
      cy.getByTestId('second-input').as('second');
      cy.getByTestId('third-input').as('third');
      cy.getByTestId('fourth-input').as('fourth');
      cy.getByTestId('fifth-input').as('fifth');

      cy.get('@first').clear();
      cy.get('@first').type( 'This is the first control');

      cy.get('@second').clear();
      cy.get('@second').type( 'I entered something here');

      cy.get('@third').clear();
      cy.get('@third').type( 'Here is some value');

      cy.get('@fourth').clear();
      cy.get('@fourth').type( 'Go Fourth');

      cy.get('@fifth').clear();
      cy.get('@fifth').type( 'Something');


      cy.getByTestId('submit').click();

      cy.get('@first').should('have.value', 'This is the first control');
      cy.get('@second').should('have.value', 'I entered something here');
      cy.get('@third').should('have.value', 'Here is some value');
      cy.get('@fourth').should('have.value', 'Go Fourth');
      cy.get('@fifth').should('have.value', 'Something');
    });

  });
});
