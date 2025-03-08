// noinspection DuplicatedCode

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

  describe('validation', () => {
    it('should use single validator', () => {
      cy.mount(ControlIntegrationHostComponent, {
        providers: [formworkProviders],
        componentProperties: {
          content: {
            id: 'first',
            type: 'test-text-control',
            label: 'First label',
            validators: ['required'],
          },
        },
      });
      cy.getByTestId('first-input').as('input');
      cy.get('@input').type('X');
      cy.get('@input').clear();
      cy.get('@input').blur();

      cy.getByTestId('first-validation-error-required').should(
        'contain.text',
        'Required',
      );
    });

    it('should use multiple validators (custom, async)', () => {
      cy.mount(ControlIntegrationHostComponent, {
        providers: [formworkProviders],
        componentProperties: {
          content: {
            id: 'first',
            type: 'test-text-control',
            label: 'First label',
            validators: ['min-chars', 'letter'],
            asyncValidators: ['async'],
          },
        },
      });
      cy.getByTestId('first-input').as('input');
      cy.get('@input').type('X');
      cy.get('@input').blur();

      cy.getByTestId('first-validation-error-min-chars').should(
        'contain.text',
        'Needs 3 characters',
      );

      cy.getByTestId('first-validation-error-letter').should(
        'contain.text',
        'Must contain the letter A',
      );

      cy.get('@input').clear();
      cy.get('@input').type('ASY');
      cy.getByTestId('first-validation-error-async').should(
        'contain.text',
        'async',
      );
      cy.getByTestId('first-validation-error-min-chars').should('not.exist');
      cy.getByTestId('first-validation-error-letter').should('not.exist');
      cy.getByTestId('first-validation-error-combined').should('not.exist');

      cy.get('@input').type('NC');
      cy.getByTestId('first-validation-error-async').should('not.exist');
    });

    it('should use combined validators', () => {
      cy.mount(ControlIntegrationHostComponent, {
        providers: [formworkProviders],
        componentProperties: {
          content: {
            id: 'first',
            type: 'test-text-control',
            label: 'First label',
            validators: ['combined'],
          },
        },
      });
      cy.getByTestId('first-input').as('input');
      cy.get('@input').type('X');
      cy.get('@input').blur();

      cy.getByTestId('first-validation-error-min-chars').should(
        'contain.text',
        'Needs 3 characters',
      );

      cy.getByTestId('first-validation-error-letter').should(
        'contain.text',
        'Must contain the letter A',
      );
    });
  });
});
