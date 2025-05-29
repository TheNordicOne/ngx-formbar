import { setupForm } from '../../helper/test';

describe('Form content', () => {
  beforeEach(() => {
    setupForm([
      {
        id: 'first',
        type: 'test-text-control',
        label: 'First',
        useDefaultTestId: true,
      },
      {
        id: 'block',
        type: 'test-block',
        message: 'This is an information',
        useDefaultTestId: true,
      },
      // @ts-expect-error: Typing is not resolved correctly
      {
        type: 'test-group',
        id: 'first-group',
        title: 'First Group',
        useDefaultTestId: true,
        controls: [
          {
            id: 'first',
            type: 'test-text-control',
            label: 'Grouped First label',
            useDefaultTestId: true,
          },
          {
            type: 'test-group',
            id: 'nested-group',
            title: 'Nested Group',
            useDefaultTestId: true,
            controls: [
              {
                id: 'first',
                type: 'test-text-control',
                label: 'Nested First label',
                useDefaultTestId: true,
              },
            ],
          },
        ],
      },
    ]);
  });

  it('should build the test id based on the form structure by default', () => {
    cy.getByTestId('first-input').should('exist');
    cy.getByTestId('block').should('exist');

    cy.getByTestId('first-group').should('exist');
    cy.getByTestId('first-group-first-input').should('exist');

    cy.getByTestId('first-group-nested-group').should('exist');
    cy.getByTestId('first-group-nested-group-first-input').should('exist');
  });
});
