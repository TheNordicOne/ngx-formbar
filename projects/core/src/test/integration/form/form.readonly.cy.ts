import { setupForm } from '../../helper/test';

describe('Form readonly', () => {
  it('should set readonly on all controls using a static value', () => {
    setupForm([
      {
        id: 'first',
        type: 'test-text-control',
        label: 'First',
        defaultValue: 'default-first',
        readonly: true,
      },
      {
        type: 'test-group',
        id: 'first-group',
        title: 'First Group',
        readonly: true,
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
    cy.getByTestId('first-input').should('have.attr', 'readonly');
    cy.getByTestId('grouped-first-input').should('have.attr', 'readonly');
    cy.getByTestId('nested-second-input').should('have.attr', 'readonly');
  });

  it('should set readonly on all controls based on a condition', () => {
    setupForm([
      {
        id: 'readonlyControl',
        type: 'test-text-control',
        label: 'Type "readonly" to readonly everything',
      },
      {
        id: 'first',
        type: 'test-text-control',
        label: 'First',
        defaultValue: 'default-first',
        readonly: 'readonlyControl === "readonly"',
      },
      {
        type: 'test-group',
        id: 'first-group',
        title: 'First Group',
        readonly: 'readonlyControl === "readonly"',
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

    cy.getByTestId('first-input').should('not.have.attr', 'readonly');
    cy.getByTestId('grouped-first-input').should('not.have.attr', 'readonly');
    cy.getByTestId('nested-second-input').should('not.have.attr', 'readonly');

    cy.getByTestId('readonlyControl-input').clear().type('readonly');

    cy.getByTestId('first-input').should('have.attr', 'readonly');
    cy.getByTestId('grouped-first-input').should('have.attr', 'readonly');
    cy.getByTestId('nested-second-input').should('have.attr', 'readonly');

    cy.getByTestId('readonlyControl-input').clear().type('something else');

    cy.getByTestId('first-input').should('not.have.attr', 'readonly');
    cy.getByTestId('grouped-first-input').should('not.have.attr', 'readonly');
    cy.getByTestId('nested-second-input').should('not.have.attr', 'readonly');
  });

  it('should set readonly on all controls in a group, but allow overwriting', () => {
    setupForm([
      {
        id: 'first',
        type: 'test-text-control',
        label: 'First',
        defaultValue: 'default-first',
        readonly: true,
      },
      {
        type: 'test-group',
        id: 'first-group',
        title: 'First Group',
        readonly: true,
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
            readonly: false,
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
                readonly: false,
              },
            ],
          },
        ],
      },
    ]);

    cy.getByTestId('first-input').should('have.attr', 'readonly');

    cy.getByTestId('grouped-first-input').should('have.attr', 'readonly');
    cy.getByTestId('nested-second-input').should('have.attr', 'readonly');

    cy.getByTestId('grouped-overwritten-input').should(
      'not.have.attr',
      'readonly',
    );
    cy.getByTestId('nested-overwritten-input').should(
      'not.have.attr',
      'readonly',
    );
  });

  it('should start with the correct value', () => {
    setupForm([
      {
        id: 'readonlyControl',
        type: 'test-text-control',
        label: 'Type "readonly" to readonly everything',
        defaultValue: 'readonly',
      },
      {
        id: 'first',
        type: 'test-text-control',
        label: 'First',
        defaultValue: 'default-first',
        readonly: 'readonlyControl === "readonly"',
      },
      {
        type: 'test-group',
        id: 'first-group',
        title: 'First Group',
        readonly: 'readonlyControl === "readonly"',
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

    cy.getByTestId('first-input').should('have.attr', 'readonly');
    cy.getByTestId('grouped-first-input').should('have.attr', 'readonly');
    cy.getByTestId('nested-second-input').should('have.attr', 'readonly');

    cy.getByTestId('readonlyControl-input').clear();

    cy.getByTestId('first-input').should('not.have.attr', 'readonly');
    cy.getByTestId('grouped-first-input').should('not.have.attr', 'readonly');
    cy.getByTestId('nested-second-input').should('not.have.attr', 'readonly');
  });
});
