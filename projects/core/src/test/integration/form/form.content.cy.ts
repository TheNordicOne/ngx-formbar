import { setupForm } from '../../helper/test';

describe('Form content', () => {
  beforeEach(() => {
    setupForm([
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
      {
        id: 'block',
        type: 'test-block',
        message: 'This is an information',
      },
      {
        type: 'test-group',
        id: 'first-group',
        title: 'First Group',
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
  });

  it('should show all content based on the form config', () => {
    cy.getByTestId('first-input').should('have.value', 'default-first');
    cy.getByTestId('second-input').should('have.value', 'default-second');
    cy.getByTestId('third-input').should('have.value', 'default-third');
    cy.getByTestId('fourth-input').should('have.value', 'default-fourth');
    cy.getByTestId('fifth-input').should('have.value', 'default-fifth');

    cy.getByTestId('block').should('contain', 'This is an information');

    cy.getByTestId('first-group-title').should('have.text', 'First Group');
    cy.getByTestId('grouped-first-input').should(
      'have.value',
      'default-grouped-first',
    );

    cy.getByTestId('nested-group-title').should('have.text', 'Nested Group');
    cy.getByTestId('nested-second-input').should(
      'have.value',
      'default-nested-second',
    );
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
    cy.getByTestId('grouped-first-input').as('groupedFirst');
    cy.getByTestId('nested-second-input').as('nestedSecond');

    cy.get('@first').clear();
    cy.get('@first').type('This is the first control');

    cy.get('@second').clear();
    cy.get('@second').type('I entered something here');

    cy.get('@third').clear();
    cy.get('@third').type('Here is some value');

    cy.get('@fourth').clear();
    cy.get('@fourth').type('Go Fourth');

    cy.get('@fifth').clear();
    cy.get('@fifth').type('Something');

    cy.get('@groupedFirst').clear();
    cy.get('@groupedFirst').type('Grouped Input');

    cy.get('@nestedSecond').clear();
    cy.get('@nestedSecond').type('Nested Grouped Input');

    cy.getByTestId('submit').click();

    cy.getByTestId('first-value').should(
      'have.text',
      'This is the first control',
    );
    cy.getByTestId('second-value').should(
      'have.text',
      'I entered something here',
    );
    cy.getByTestId('third-value').should('have.text', 'Here is some value');
    cy.getByTestId('fourth-value').should('have.text', 'Go Fourth');
    cy.getByTestId('fifth-value').should('have.text', 'Something');
    cy.getByTestId('first-group.grouped-first-value').should(
      'have.text',
      'Grouped Input',
    );
    cy.getByTestId('first-group.nested-group.nested-second-value').should(
      'have.text',
      'Nested Grouped Input',
    );
  });
});
