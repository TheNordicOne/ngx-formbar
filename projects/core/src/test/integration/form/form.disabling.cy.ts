import { setupForm } from '../../helper/test';

describe('Form disabling', () => {
  it('should disable all controls using a static value', () => {
    setupForm([
      {
        id: 'first',
        type: 'test-text-control',
        label: 'First',
        defaultValue: 'default-first',
        disabled: true,
      },
      {
        type: 'test-group',
        id: 'first-group',
        title: 'First Group',
        disabled: true,
        controls: [
          {
            id: 'grouped-first',
            type: 'test-text-control',
            label: 'Grouped First label',
            defaultValue: 'default-grouped-first',
          },
          {
            type: 'test-group',
            id: 'nested-group',
            title: 'Nested Group',
            controls: [
              {
                id: 'nested-second',
                type: 'test-text-control',
                label: 'Nested Second label',
                defaultValue: 'default-nested-second',
              },
            ],
          },
        ],
      },
    ]);
    cy.getByTestId('first-input').should('have.attr', 'disabled');
    cy.getByTestId('grouped-first-input').should('have.attr', 'disabled');
    cy.getByTestId('nested-second-input').should('have.attr', 'disabled');
  });

  it('should disable all controls based on a condition', () => {
    setupForm([
      {
        id: 'disableControl',
        type: 'test-text-control',
        label: 'Type "disable" to disable everything',
      },
      {
        id: 'first',
        type: 'test-text-control',
        label: 'First',
        defaultValue: 'default-first',
        disabled: 'disableControl === "disable"',
      },
      {
        type: 'test-group',
        id: 'first-group',
        title: 'First Group',
        disabled: 'disableControl === "disable"',
        controls: [
          {
            id: 'grouped-first',
            type: 'test-text-control',
            label: 'Grouped First label',
            defaultValue: 'default-grouped-first',
          },
          {
            type: 'test-group',
            id: 'nested-group',
            title: 'Nested Group',
            controls: [
              {
                id: 'nested-second',
                type: 'test-text-control',
                label: 'Nested Second label',
                defaultValue: 'default-nested-second',
              },
            ],
          },
        ],
      },
    ]);

    cy.getByTestId('first-input').should('not.have.attr', 'disabled');
    cy.getByTestId('grouped-first-input').should('not.have.attr', 'disabled');
    cy.getByTestId('nested-second-input').should('not.have.attr', 'disabled');

    cy.getByTestId('disableControl-input').clear().type('disable');

    cy.getByTestId('first-input').should('have.attr', 'disabled');
    cy.getByTestId('grouped-first-input').should('have.attr', 'disabled');
    cy.getByTestId('nested-second-input').should('have.attr', 'disabled');

    cy.getByTestId('disableControl-input').clear().type('something else');

    cy.getByTestId('first-input').should('not.have.attr', 'disabled');
    cy.getByTestId('grouped-first-input').should('not.have.attr', 'disabled');
    cy.getByTestId('nested-second-input').should('not.have.attr', 'disabled');
  });

  it('should disable all controls in a group, but allow overwriting', () => {
    setupForm([
      {
        id: 'first',
        type: 'test-text-control',
        label: 'First',
        defaultValue: 'default-first',
        disabled: true,
      },
      {
        type: 'test-group',
        id: 'first-group',
        title: 'First Group',
        disabled: true,
        controls: [
          {
            id: 'grouped-first',
            type: 'test-text-control',
            label: 'Grouped First label',
            defaultValue: 'default-grouped-first',
          },
          {
            id: 'grouped-overwritten',
            type: 'test-text-control',
            label: 'Grouped Overwritten label',
            defaultValue: 'default-grouped-overwritten',
            disabled: false,
          },
          {
            type: 'test-group',
            id: 'nested-group',
            title: 'Nested Group',
            controls: [
              {
                id: 'nested-second',
                type: 'test-text-control',
                label: 'Nested Second label',
                defaultValue: 'default-nested-second',
              },
              {
                id: 'nested-overwritten',
                type: 'test-text-control',
                label: 'Nested Overwritten label',
                defaultValue: 'default-nested-overwritten',
                disabled: false,
              },
            ],
          },
        ],
      },
    ]);

    cy.getByTestId('first-input').should('have.attr', 'disabled');

    cy.getByTestId('grouped-first-input').should('have.attr', 'disabled');
    cy.getByTestId('nested-second-input').should('have.attr', 'disabled');

    cy.getByTestId('grouped-overwritten-input').should(
      'not.have.attr',
      'disabled',
    );
    cy.getByTestId('nested-overwritten-input').should(
      'not.have.attr',
      'disabled',
    );
  });
});
