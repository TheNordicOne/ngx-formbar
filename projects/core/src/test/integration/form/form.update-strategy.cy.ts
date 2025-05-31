import { setupForm } from '../../helper/test';

describe('Form updateOn strategies', () => {
  describe('without global default', () => {
    it('should use Angular default (change) when no strategy specified', () => {
      setupForm(
        {
          content: [
            {
              id: 'default-control',
              type: 'test-text-control',
              label: 'Default Strategy',
              defaultValue: '',
            },
          ],
        },
        { autoUpdate: true },
      );

      cy.getByTestId('default-control-input').as('defaultInput');
      cy.get('@defaultInput').clear().type('new-text');

      cy.getByTestId('default-control-value').should('have.text', 'new-text');
    });

    it('should respect explicit updateOn strategies on controls', () => {
      setupForm(
        {
          content: [
            {
              id: 'change-control',
              type: 'test-text-control',
              label: 'Change Control',
              updateOn: 'change',
            },
            {
              id: 'blur-control',
              type: 'test-text-control',
              label: 'Blur Control',
              updateOn: 'blur',
            },
            {
              id: 'submit-control',
              type: 'test-text-control',
              label: 'Submit Control',
              updateOn: 'submit',
            },
          ],
        },
        { autoUpdate: true },
      );

      // Change strategy
      cy.getByTestId('change-control-input').as('changeInput');
      cy.get('@changeInput').clear().type('change-text');
      cy.getByTestId('change-control-value').should('have.text', 'change-text');

      // Blur strategy
      cy.getByTestId('blur-control-input').as('blurInput');
      cy.get('@blurInput').clear().type('blur-text');
      cy.getByTestId('blur-control-value').should('be.empty');
      cy.get('@blurInput').blur();
      cy.getByTestId('blur-control-value').should('have.text', 'blur-text');

      // Submit strategy
      cy.getByTestId('submit-control-input').as('submitInput');
      cy.get('@submitInput').clear().type('submit-text');
      cy.get('@submitInput').blur();
      cy.getByTestId('submit-control-value').should('be.empty');
      cy.getByTestId('submit').click();
      cy.getByTestId('submit-control-value').should('have.text', 'submit-text');
    });
  });

  describe('with global default', () => {
    it('should apply global default strategy when none specified', () => {
      setupForm(
        {
          content: [
            {
              id: 'control',
              type: 'test-text-control',
              label: 'Control',
            },
          ],
        },
        { defaultUpdateOnStrategy: 'blur', autoUpdate: true },
      );

      cy.getByTestId('control-input').as('input');
      cy.get('@input').clear().type('new-text');
      cy.getByTestId('control-value').should('not.exist');
      cy.get('@input').blur();
      cy.getByTestId('control-value').should('have.text', 'new-text');
    });

    it('should allow controls to override global default', () => {
      setupForm(
        {
          content: [
            {
              id: 'default-control',
              type: 'test-text-control',
              label: 'Default Control',
            },
            {
              id: 'override-control',
              type: 'test-text-control',
              label: 'Override Control',
              updateOn: 'change',
            },
          ],
        },
        { defaultUpdateOnStrategy: 'submit', autoUpdate: true },
      );

      // Global default (submit)
      cy.getByTestId('default-control-input').as('defaultInput');
      cy.get('@defaultInput').clear().type('default-text');
      cy.get('@defaultInput').blur();
      cy.getByTestId('default-control-value').should('not.exist');

      // Override (change)
      cy.getByTestId('override-control-input').as('overrideInput');
      cy.get('@overrideInput').clear().type('override-text');
      cy.getByTestId('override-control-value').should(
        'have.text',
        'override-text',
      );

      // Verify submit works for default
      cy.getByTestId('submit').click();
      cy.getByTestId('default-control-value').should(
        'have.text',
        'default-text',
      );
    });
  });

  describe('Form group updateOn strategies', () => {
    it('should apply parent group strategy to child controls', () => {
      setupForm(
        {
          content: [
            {
              id: 'parent-group',
              type: 'test-group',
              updateOn: 'blur',
              controls: [
                {
                  id: 'child-control',
                  type: 'test-text-control',
                  label: 'Child Control',
                  // Should inherit 'blur' from parent
                },
              ],
            },
          ],
        },
        { autoUpdate: true },
      );

      cy.getByTestId('child-control-input').as('childInput');
      cy.get('@childInput').clear().type('child-text');
      cy.getByTestId('parent-group.child-control-value').should('not.exist');
      cy.get('@childInput').blur();
      cy.getByTestId('parent-group.child-control-value').should(
        'have.text',
        'child-text',
      );
    });

    it('should allow controls to override parent group strategy', () => {
      setupForm(
        {
          content: [
            {
              id: 'parent-group',
              type: 'test-group',
              updateOn: 'blur',
              controls: [
                {
                  id: 'inherited-control',
                  type: 'test-text-control',
                  label: 'Inherited Control',
                  // Inherits 'blur'
                },
                {
                  id: 'override-control',
                  type: 'test-text-control',
                  label: 'Override Control',
                  updateOn: 'change',
                  // Explicitly overrides to 'change'
                },
              ],
            },
          ],
        },
        { autoUpdate: true },
      );

      // Inherited control (blur)
      cy.getByTestId('inherited-control-input').as('inheritedInput');
      cy.get('@inheritedInput').clear().type('inherited-text');
      cy.getByTestId('parent-group.inherited-control-value').should(
        'not.exist',
      );
      cy.get('@inheritedInput').blur();
      cy.getByTestId('parent-group.inherited-control-value').should(
        'have.text',
        'inherited-text',
      );

      // Overridden control (change)
      cy.getByTestId('override-control-input').as('overrideInput');
      cy.get('@overrideInput').clear().type('override-text');
      cy.getByTestId('parent-group.override-control-value').should(
        'have.text',
        'override-text',
      );
    });

    it('should handle nested group inheritance', () => {
      setupForm(
        {
          content: [
            {
              id: 'root-group',
              type: 'test-group',
              updateOn: 'submit',
              controls: [
                {
                  id: 'child-group',
                  type: 'test-group',
                  // Inherits 'submit'
                  controls: [
                    {
                      id: 'grandchild-control',
                      type: 'test-text-control',
                      label: 'Grandchild Control',
                      // Inherits 'submit' from parent chain
                    },
                  ],
                },
                {
                  id: 'override-group',
                  type: 'test-group',
                  updateOn: 'blur',
                  // Overrides to 'blur'
                  controls: [
                    {
                      id: 'grandchild-override-control',
                      type: 'test-text-control',
                      label: 'Grandchild Override Control',
                      // Inherits 'blur' from immediate parent
                    },
                  ],
                },
              ],
            },
          ],
        },
        { autoUpdate: true },
      );

      // Control inheriting 'submit' through nested groups
      cy.getByTestId('grandchild-control-input').as('grandchildInput');
      cy.get('@grandchildInput').clear().type('grandchild-text');
      cy.get('@grandchildInput').blur();
      cy.getByTestId('root-group.child-group.grandchild-control-value').should(
        'not.exist',
      );
      cy.getByTestId('submit').click();
      cy.getByTestId('root-group.child-group.grandchild-control-value').should(
        'have.text',
        'grandchild-text',
      );

      // Control inheriting 'blur' from overridden parent group
      cy.getByTestId('grandchild-override-control-input').as('overrideInput');
      cy.get('@overrideInput').clear().type('override-grandchild-text');
      cy.getByTestId(
        'root-group.override-group.grandchild-override-control-value',
      ).should('be.empty');
      cy.get('@overrideInput').blur();
      cy.getByTestId(
        'root-group.override-group.grandchild-override-control-value',
      ).should('have.text', 'override-grandchild-text');
    });

    it('should respect global default with nested groups', () => {
      setupForm(
        {
          content: [
            {
              id: 'root-group',
              type: 'test-group',
              // Uses global default
              controls: [
                {
                  id: 'child-control',
                  type: 'test-text-control',
                  label: 'Child Control',
                  // Inherits global default
                },
                {
                  id: 'child-group',
                  type: 'test-group',
                  updateOn: 'change',
                  // Overrides global default
                  controls: [
                    {
                      id: 'grandchild-control',
                      type: 'test-text-control',
                      label: 'Grandchild Control',
                      // Inherits 'change'
                    },
                  ],
                },
              ],
            },
          ],
        },
        { defaultUpdateOnStrategy: 'blur', autoUpdate: true },
      );

      // Control inheriting global default
      cy.getByTestId('child-control-input').as('childInput');
      cy.get('@childInput').clear().type('child-text');
      cy.getByTestId('root-group.child-control-value').should('not.exist');
      cy.get('@childInput').blur();
      cy.getByTestId('root-group.child-control-value').should(
        'have.text',
        'child-text',
      );

      // Nested control inheriting override from parent group
      cy.getByTestId('grandchild-control-input').as('grandchildInput');
      cy.get('@grandchildInput').clear().type('grandchild-text');
      cy.getByTestId('root-group.child-group.grandchild-control-value').should(
        'have.text',
        'grandchild-text',
      );
    });
  });
});
