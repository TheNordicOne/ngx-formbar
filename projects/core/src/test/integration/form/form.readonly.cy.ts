import { setupForm } from '../../helper/test';

describe('Form readonly', () => {
  it('should set readonly on all controls using a static value', () => {
    setupForm({
      content: {
        first: {
          type: 'test-text-control',
          label: 'First',
          defaultValue: 'default-first',
          readonly: true,
        },
        'first-group': {
          type: 'test-group',
          title: 'First Group',
          readonly: true,
          controls: {
            'grouped-first': {
              type: 'test-text-control',
              label: 'Grouped First label',
              defaultValue: 'default-grouped-first',
            },
            'nested-group': {
              type: 'test-group',
              title: 'Nested Group',
              controls: {
                'nested-second': {
                  type: 'test-text-control',
                  label: 'Nested Second label',
                  defaultValue: 'default-nested-second',
                },
              },
            },
          },
        },
      },
    });
    cy.getByTestId('first-input').should('have.attr', 'readonly');
    cy.getByTestId('grouped-first-input').should('have.attr', 'readonly');
    cy.getByTestId('nested-second-input').should('have.attr', 'readonly');
  });

  it('should set readonly on all controls based on a condition', () => {
    setupForm({
      content: {
        readonlyControl: {
          type: 'test-text-control',
          label: 'Type "readonly" to readonly everything',
        },
        first: {
          type: 'test-text-control',
          label: 'First',
          defaultValue: 'default-first',
          readonly: 'readonlyControl === "readonly"',
        },
        'first-group': {
          type: 'test-group',
          title: 'First Group',
          readonly: 'readonlyControl === "readonly"',
          controls: {
            'grouped-first': {
              type: 'test-text-control',
              label: 'Grouped First label',
              defaultValue: 'default-grouped-first',
            },
            'nested-group': {
              type: 'test-group',
              title: 'Nested Group',
              controls: {
                'nested-second': {
                  type: 'test-text-control',
                  label: 'Nested Second label',
                  defaultValue: 'default-nested-second',
                },
              },
            },
          },
        },
      },
    });

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
    setupForm({
      content: {
        first: {
          type: 'test-text-control',
          label: 'First',
          defaultValue: 'default-first',
          readonly: true,
        },
        'first-group': {
          type: 'test-group',
          title: 'First Group',
          readonly: true,
          controls: {
            'grouped-first': {
              type: 'test-text-control',
              label: 'Grouped First label',
              defaultValue: 'default-grouped-first',
            },
            'grouped-overwritten': {
              type: 'test-text-control',
              label: 'Grouped Overwritten label',
              defaultValue: 'default-grouped-overwritten',
              readonly: false,
            },
            'nested-group': {
              type: 'test-group',
              title: 'Nested Group',
              controls: {
                'nested-second': {
                  type: 'test-text-control',
                  label: 'Nested Second label',
                  defaultValue: 'default-nested-second',
                },
                'nested-overwritten': {
                  type: 'test-text-control',
                  label: 'Nested Overwritten label',
                  defaultValue: 'default-nested-overwritten',
                  readonly: false,
                },
              },
            },
          },
        },
      },
    });

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
    setupForm({
      content: {
        readonlyControl: {
          type: 'test-text-control',
          label: 'Type "readonly" to readonly everything',
          defaultValue: 'readonly',
        },
        first: {
          type: 'test-text-control',
          label: 'First',
          defaultValue: 'default-first',
          readonly: 'readonlyControl === "readonly"',
        },
        'first-group': {
          type: 'test-group',
          title: 'First Group',
          readonly: 'readonlyControl === "readonly"',
          controls: {
            'grouped-first': {
              type: 'test-text-control',
              label: 'Grouped First label',
              defaultValue: 'default-grouped-first',
            },
            'nested-group': {
              type: 'test-group',
              title: 'Nested Group',
              controls: {
                'nested-second': {
                  type: 'test-text-control',
                  label: 'Nested Second label',
                  defaultValue: 'default-nested-second',
                },
              },
            },
          },
        },
      },
    });

    cy.getByTestId('first-input').should('have.attr', 'readonly');
    cy.getByTestId('grouped-first-input').should('have.attr', 'readonly');
    cy.getByTestId('nested-second-input').should('have.attr', 'readonly');

    cy.getByTestId('readonlyControl-input').clear();

    cy.getByTestId('first-input').should('not.have.attr', 'readonly');
    cy.getByTestId('grouped-first-input').should('not.have.attr', 'readonly');
    cy.getByTestId('nested-second-input').should('not.have.attr', 'readonly');
  });
});
