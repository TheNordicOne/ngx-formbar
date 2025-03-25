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

  describe('visibility', () => {
    beforeEach(() => {
      cy.mount(FormIntegrationHostComponent, {
        providers: [formworkProviders],
        componentProperties: {
          formContent: [
            {
              id: 'hideControl',
              type: 'test-text-control',
              label: 'Type "hide" to hide everything',
            },
            {
              id: 'first',
              type: 'test-text-control',
              label: 'Keep and use last value',
              defaultValue: 'default-first',
              hide: 'hideControl === "hide"',
              hideStrategy: 'keep',
              valueStrategy: 'last',
            },
            {
              id: 'second',
              type: 'test-text-control',
              label: 'Remove but remember last value',
              defaultValue: 'default-second',
              hide: 'hideControl === "hide"',
              hideStrategy: 'remove',
              valueStrategy: 'last',
            },
            {
              id: 'third',
              type: 'test-text-control',
              label: 'Keep but use default value',
              defaultValue: 'default-third',
              hide: 'hideControl === "hide"',
              hideStrategy: 'keep',
              valueStrategy: 'default',
            },
            {
              id: 'fourth',
              type: 'test-text-control',
              label: 'Remove but use default value',
              defaultValue: 'default-fourth',
              hide: 'hideControl === "hide"',
              hideStrategy: 'remove',
              valueStrategy: 'default',
            },
            {
              id: 'fifth',
              type: 'test-text-control',
              label: 'Keep but reset value',
              defaultValue: 'default-fifth',
              hide: 'hideControl === "hide"',
              hideStrategy: 'keep',
              valueStrategy: 'reset',
            },
            {
              id: 'sixth',
              type: 'test-text-control',
              label: 'Remove and reset value',
              defaultValue: 'default-sixth',
              hide: 'hideControl === "hide"',
              hideStrategy: 'remove',
              valueStrategy: 'reset',
            },
            {
              type: 'test-group',
              id: 'first-group',
              title: 'Keep and use last value',
              hide: 'hideControl === "hide"',
              hideStrategy: 'keep',
              valueStrategy: 'last',
              controls: [
                {
                  id: 'grouped-first',
                  type: 'test-text-control',
                  label: 'Grouped First label',
                  defaultValue: 'default-grouped-first',
                },
              ],
            },
            {
              type: 'test-group',
              id: 'second-group',
              title: 'Remove but remember last value',
              hide: 'hideControl === "hide"',
              hideStrategy: 'remove',
              valueStrategy: 'last',
              controls: [
                {
                  id: 'grouped-second',
                  type: 'test-text-control',
                  label: 'Grouped Second label',
                  defaultValue: 'default-grouped-second',
                },
              ],
            },
            {
              type: 'test-group',
              id: 'third-group',
              title: 'Keep but use default value',
              hide: 'hideControl === "hide"',
              hideStrategy: 'keep',
              valueStrategy: 'default',
              controls: [
                {
                  id: 'grouped-third',
                  type: 'test-text-control',
                  label: 'Grouped Third label',
                  defaultValue: 'default-grouped-third',
                },
              ],
            },
            {
              type: 'test-group',
              id: 'fourth-group',
              title: 'Remove but use default value',
              hide: 'hideControl === "hide"',
              hideStrategy: 'remove',
              valueStrategy: 'default',
              controls: [
                {
                  id: 'grouped-fourth',
                  type: 'test-text-control',
                  label: 'Grouped Four label',
                  defaultValue: 'default-grouped-fourth',
                },
              ],
            },
            {
              type: 'test-group',
              id: 'fifth-group',
              title: 'Keep but reset value',
              hide: 'hideControl === "hide"',
              hideStrategy: 'keep',
              valueStrategy: 'reset',
              controls: [
                {
                  id: 'grouped-fifth',
                  type: 'test-text-control',
                  label: 'Grouped Five label',
                  defaultValue: 'default-grouped-fifth',
                },
              ],
            },
            {
              type: 'test-group',
              id: 'sixth-group',
              title: 'Remove and reset value',
              hide: 'hideControl === "hide"',
              hideStrategy: 'remove',
              valueStrategy: 'reset',
              controls: [
                {
                  id: 'grouped-sixth',
                  type: 'test-text-control',
                  label: 'Grouped Six label',
                  defaultValue: 'default-grouped-sixth',
                },
              ],
            },
          ],
        },
      });
    });

    it('should hide the control and handle value correctly', () => {
      cy.getByTestId('first-input').as('first');
      cy.getByTestId('second-input').as('second');
      cy.getByTestId('third-input').as('third');
      cy.getByTestId('fourth-input').as('fourth');
      cy.getByTestId('grouped-first-input').as('groupedFirst');
      cy.getByTestId('grouped-second-input').as('groupedSecond');
      cy.getByTestId('grouped-third-input').as('groupedThird');
      cy.getByTestId('grouped-fourth-input').as('groupedFourth');

      cy.get('@first').clear();
      cy.get('@first').type('This is the first control');

      cy.get('@second').clear();
      cy.get('@second').type('I entered something here');

      cy.get('@third').clear();
      cy.get('@third').type('Here is some value');

      cy.get('@fourth').clear();
      cy.get('@fourth').type('Go Fourth');

      cy.get('@groupedFirst').clear();
      cy.get('@groupedFirst').type('Grouped Input');

      cy.get('@groupedSecond').clear();
      cy.get('@groupedSecond').type('Grouped Input Two');

      cy.get('@groupedThird').clear();
      cy.get('@groupedThird').type('Grouped Input Three');

      cy.get('@groupedFourth').clear();
      cy.get('@groupedFourth').type('Grouped Input Four');

      // Hide all controls
      cy.getByTestId('hideControl').type('hide');

      // Whether or not the input is only hidden depends on the implementation
      // For our tests we only hide it, as the main goal is to check how it's value is handled
      cy.getByTestId('first-input').should('not.be.visible');
      cy.getByTestId('second-input').should('not.be.visible');
      cy.getByTestId('third-input').should('not.be.visible');
      cy.getByTestId('fourth-input').should('not.be.visible');
      cy.getByTestId('fifth-input').should('not.be.visible');
      cy.getByTestId('sixth-input').should('not.be.visible');
      cy.getByTestId('grouped-first-input').should('not.be.visible');
      cy.getByTestId('grouped-second-input').should('not.be.visible');
      cy.getByTestId('grouped-third-input').should('not.be.visible');
      cy.getByTestId('grouped-fourth-input').should('not.be.visible');
      cy.getByTestId('grouped-fifth-input').should('not.be.visible');
      cy.getByTestId('grouped-sixth-input').should('not.be.visible');

      cy.getByTestId('submit').click();

      // Keep and use last value
      cy.getByTestId('first-value').should(
        'have.text',
        'This is the first control',
      );
      cy.getByTestId('first-group.grouped-first-value').should(
        'have.text',
        'Grouped Input',
      );

      // Keep but use default value
      cy.getByTestId('third-value').should('have.text', 'default-third');
      cy.getByTestId('third-group.grouped-third-value').should(
        'have.text',
        'default-grouped-third',
      );

      // Keep but reset value
      cy.getByTestId('fifth-value').should('have.text', 'default-fifth');
      cy.getByTestId('fifth-group.grouped-fifth-value').should('have.text', '');

      // Remove
      cy.getByTestId('second-value').should('not.exist');
      cy.getByTestId('second-group.grouped-second-value').should('not.exist');

      cy.getByTestId('fourth-value').should('not.exist');
      cy.getByTestId('fourth-group.grouped-fourth-value').should('not.exist');

      cy.getByTestId('sixth-value').should('not.exist');
      cy.getByTestId('sixth-group.grouped-sixth-value').should('not.exist');

      // Show controls again
      cy.getByTestId('hideControl').clear();

      // Remove but remember last value
      cy.getByTestId('second-value').should(
        'have.text',
        'I entered something here',
      );
      cy.getByTestId('second-group.grouped-second-value').should(
        'have.text',
        'Grouped Input Two',
      );

      // Remove but use default value'
      cy.getByTestId('fourth-value').should('have.text', 'default-fourth');
      cy.getByTestId('fourth-group.grouped-fourth-value').should(
        'have.text',
        'default-grouped-fourth',
      );

      // Remove and reset value
      cy.getByTestId('sixth-value').should('have.text', 'default-sixth');
      cy.getByTestId('sixth-group.grouped-sixth-value').should('have.text', '');
    });
  });
});
