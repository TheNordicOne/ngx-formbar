import { setupForm } from '../../helper/test';

describe('Form content', () => {
  it('should build the test id based on the form structure by default', () => {
    setupForm({
      content: {
        first: {
          type: 'test-text-control',
          label: 'First',
          useDefaultTestId: true,
        },
        block: {
          type: 'test-block',
          message: 'This is an information',
          isControl: false,
          useDefaultTestId: true,
        },
        'first-group': {
          type: 'test-group',
          title: 'First Group',
          useDefaultTestId: true,
          controls: {
            first: {
              type: 'test-text-control',
              label: 'Grouped First label',
              useDefaultTestId: true,
            },
            'nested-group': {
              type: 'test-group',
              title: 'Nested Group',
              useDefaultTestId: true,
              controls: {
                first: {
                  type: 'test-text-control',
                  label: 'Nested First label',
                  useDefaultTestId: true,
                },
              },
            },
          },
        },
      },
    });

    cy.getByTestId('first-input').should('exist');
    cy.getByTestId('block').should('exist');

    cy.getByTestId('first-group').should('exist');
    cy.getByTestId('first-group-first-input').should('exist');

    cy.getByTestId('first-group-nested-group').should('exist');
    cy.getByTestId('first-group-nested-group-first-input').should('exist');
  });

  it('should build the test id based on the globally provided function, but allow individual functions too', () => {
    setupForm(
      {
        content: {
          first: {
            type: 'test-text-control',
            label: 'First',
            useDefaultTestId: true,
          },
          block: {
            type: 'test-block',
            message: 'This is an information',
            isControl: false,
            useDefaultTestId: true,
          },
          'first-group': {
            type: 'test-group',
            title: 'First Group',
            useDefaultTestId: true,
            controls: {
              first: {
                type: 'test-text-control',
                label: 'Grouped First label',
                useDefaultTestId: true,
              },
              'nested-group': {
                type: 'test-group',
                title: 'Nested Group',
                useDefaultTestId: true,
                controls: {
                  first: {
                    type: 'test-text-control',
                    label: 'Nested First label',
                    useDefaultTestId: true,
                  },
                  second: {
                    type: 'test-text-control',
                    label: 'Nested Second label',
                    useDefaultTestId: false,
                  },
                },
              },
            },
          },
        },
      },
      {
        testIdBuilderFn: (content, name, parentTestId) =>
          `${parentTestId ?? 'root'}-${content.type}-${name}`,
      },
    );

    cy.getByTestId('root-test-text-control-first-input').should('exist');
    cy.getByTestId('root-test-block-block').should('exist');

    cy.getByTestId('root-test-group-first-group').should('exist');
    cy.getByTestId(
      'root-test-group-first-group-test-text-control-first-input',
    ).should('exist');

    cy.getByTestId(
      'root-test-group-first-group-test-group-nested-group',
    ).should('exist');
    cy.getByTestId(
      'root-test-group-first-group-test-group-nested-group-test-text-control-first-input',
    ).should('exist');

    cy.getByTestId('second').should('exist');
  });
});
