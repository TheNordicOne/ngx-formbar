import { setupForm } from '../../helper/test';

describe('Form Visibility Strategies', () => {
  describe('Single field strategies', () => {
    it('should keep the field value when hidden and shown again [keep & last]', () => {
      setupForm([
        {
          id: 'hideControl',
          type: 'test-text-control',
          label: 'Type "hide" to hide everything',
        },
        {
          id: 'keepLastField',
          type: 'test-text-control',
          label: 'Keep and use last value',
          defaultValue: 'default-value',
          hidden: 'hideControl === "hide"',
          hideStrategy: 'keep',
          valueStrategy: 'last',
        },
      ]);

      const customValue = 'Custom keep & last value';

      // Fill the field with custom value
      cy.getByTestId('keepLastField-input').clear().type(customValue);

      // Hide the field
      cy.getByTestId('hideControl-input').clear().type('hide');

      // Verify field is hidden but value is preserved
      cy.getByTestId('keepLastField-input').should('not.exist');
      cy.getByTestId('submit').click();
      cy.getByTestId('keepLastField-value').should('have.text', customValue);

      // Show field again
      cy.getByTestId('hideControl-input').clear();

      // Verify field appears with the last value
      cy.getByTestId('submit').click();
      cy.getByTestId('keepLastField-value').should('have.text', customValue);
    });

    it('should remember the field value when hidden and shown again [remove & last]', () => {
      setupForm([
        {
          id: 'hideControl',
          type: 'test-text-control',
          label: 'Type "hide" to hide everything',
        },
        {
          id: 'removeLastField',
          type: 'test-text-control',
          label: 'Remove but remember last value',
          defaultValue: 'default-value',
          hidden: 'hideControl === "hide"',
          hideStrategy: 'remove',
          valueStrategy: 'last',
        },
      ]);

      const customValue = 'Custom remove & last value';

      // Fill the field with custom value
      cy.getByTestId('removeLastField-input').clear().type(customValue);

      // Hide the field
      cy.getByTestId('hideControl-input').clear().type('hide');

      // Verify field is hidden and not in the form value when hidden
      cy.getByTestId('removeLastField-input').should('not.exist');
      cy.getByTestId('submit').click();
      cy.getByTestId('removeLastField-value').should('not.exist');

      // Show field again
      cy.getByTestId('hideControl-input').clear();

      // Verify field appears with the last value
      cy.getByTestId('submit').click();
      cy.getByTestId('removeLastField-value').should('have.text', customValue);
    });

    it('should revert to default value when hidden [keep & default]', () => {
      const defaultValue = 'default-keep-default';

      setupForm([
        {
          id: 'hideControl',
          type: 'test-text-control',
          label: 'Type "hide" to hide everything',
        },
        {
          id: 'keepDefaultField',
          type: 'test-text-control',
          label: 'Keep but use default value',
          defaultValue: defaultValue,
          hidden: 'hideControl === "hide"',
          hideStrategy: 'keep',
          valueStrategy: 'default',
        },
      ]);

      const customValue = 'Custom keep & default value';

      // Fill the field with custom value
      cy.getByTestId('keepDefaultField-input').clear().type(customValue);

      // Hide the field
      cy.getByTestId('hideControl-input').clear().type('hide');

      // Verify field is hidden but value reverts to default
      cy.getByTestId('keepDefaultField-input').should('not.exist');
      cy.getByTestId('submit').click();
      cy.getByTestId('keepDefaultField-value').should(
        'have.text',
        defaultValue,
      );

      // Show field again
      cy.getByTestId('hideControl-input').clear();

      // Verify field appears with default value
      cy.getByTestId('submit').click();
      cy.getByTestId('keepDefaultField-value').should(
        'have.text',
        defaultValue,
      );
    });

    it('should use default value when shown again [remove & default]', () => {
      const defaultValue = 'default-remove-default';

      setupForm([
        {
          id: 'hideControl',
          type: 'test-text-control',
          label: 'Type "hide" to hide everything',
        },
        {
          id: 'removeDefaultField',
          type: 'test-text-control',
          label: 'Remove but use default value',
          defaultValue: defaultValue,
          hidden: 'hideControl === "hide"',
          hideStrategy: 'remove',
          valueStrategy: 'default',
        },
      ]);

      const customValue = 'Custom remove & default value';

      // Fill the field with custom value
      cy.getByTestId('removeDefaultField-input').clear().type(customValue);

      // Hide the field
      cy.getByTestId('hideControl-input').clear().type('hide');

      // Verify field is hidden and not in form value
      cy.getByTestId('removeDefaultField-input').should('not.exist');
      cy.getByTestId('submit').click();
      cy.getByTestId('removeDefaultField-value').should('not.exist');

      // Show field again
      cy.getByTestId('hideControl-input').clear();

      // Verify field appears with default value
      cy.getByTestId('submit').click();
      cy.getByTestId('removeDefaultField-value').should(
        'have.text',
        defaultValue,
      );
    });

    it('should reset value when hidden [keep & reset]', () => {
      setupForm([
        {
          id: 'hideControl',
          type: 'test-text-control',
          label: 'Type "hide" to hide everything',
        },
        {
          id: 'keepResetField',
          type: 'test-text-control',
          label: 'Keep but reset value',
          defaultValue: 'default-keep-reset',
          hidden: 'hideControl === "hide"',
          hideStrategy: 'keep',
          valueStrategy: 'reset',
        },
      ]);

      const customValue = 'Custom keep & reset value';

      // Fill the field with custom value
      cy.getByTestId('keepResetField-input').clear().type(customValue);

      // Hide the field
      cy.getByTestId('hideControl-input').clear().type('hide');

      // Verify field is hidden but value is reset to empty
      cy.getByTestId('keepResetField-input').should('not.exist');
      cy.getByTestId('submit').click();
      cy.getByTestId('keepResetField-value').should('have.text', '');

      // Show field again
      cy.getByTestId('hideControl-input').clear();

      // Verify field appears with empty value
      cy.getByTestId('submit').click();
      cy.getByTestId('keepResetField-value').should('have.text', '');
    });

    it('should have empty value when shown again [remove & reset]', () => {
      setupForm([
        {
          id: 'hideControl',
          type: 'test-text-control',
          label: 'Type "hide" to hide everything',
        },
        {
          id: 'removeResetField',
          type: 'test-text-control',
          label: 'Remove and reset value',
          defaultValue: 'default-remove-reset',
          hidden: 'hideControl === "hide"',
          hideStrategy: 'remove',
          valueStrategy: 'reset',
        },
      ]);

      const customValue = 'Custom remove & reset value';

      // Fill the field with custom value
      cy.getByTestId('removeResetField-input').clear().type(customValue);

      // Hide the field
      cy.getByTestId('hideControl-input').clear().type('hide');

      // Verify field is hidden and not in form value
      cy.getByTestId('removeResetField-input').should('not.exist');
      cy.getByTestId('submit').click();
      cy.getByTestId('removeResetField-value').should('not.exist');

      // Show field again
      cy.getByTestId('hideControl-input').clear();

      // Verify field appears with empty value
      cy.getByTestId('submit').click();
      cy.getByTestId('removeResetField-value').should('have.text', '');
    });
  });

  describe('Group field strategies', () => {
    it('should handle group with keep & last strategy correctly [keep & last group]', () => {
      setupForm([
        {
          id: 'hideControl',
          type: 'test-text-control',
          label: 'Type "hide" to hide everything',
        },
        {
          type: 'test-group',
          id: 'keepLastGroup',
          title: 'Keep and use last value',
          hidden: 'hideControl === "hide"',
          hideStrategy: 'keep',
          valueStrategy: 'last',
          controls: [
            {
              id: 'childField',
              type: 'test-text-control',
              label: 'Child field',
              defaultValue: 'default-child',
            },
            {
              id: 'childDefaultField',
              type: 'test-text-control',
              label: 'Child with default strategy',
              defaultValue: 'default-child-default',
              valueStrategy: 'default',
            },
            {
              id: 'childResetField',
              type: 'test-text-control',
              label: 'Child with reset strategy',
              defaultValue: 'default-child-reset',
              valueStrategy: 'reset',
            },
          ],
        },
      ]);

      // Fill fields with custom values
      cy.getByTestId('childField-input').clear().type('Custom child value');
      cy.getByTestId('childDefaultField-input')
        .clear()
        .type('Custom child default value');
      cy.getByTestId('childResetField-input')
        .clear()
        .type('Custom child reset value');

      // Hide the group
      cy.getByTestId('hideControl-input').clear().type('hide');

      // Verify group is hidden but values are handled according to their strategies
      cy.getByTestId('keepLastGroup-title').should('not.be.visible');
      cy.getByTestId('submit').click();

      // Child inherits parent's last value strategy
      cy.getByTestId('keepLastGroup.childField-value').should(
        'have.text',
        'Custom child value',
      );

      // Child with default strategy overrides parent
      cy.getByTestId('keepLastGroup.childDefaultField-value').should(
        'have.text',
        'default-child-default',
      );

      // Child with reset strategy overrides parent
      cy.getByTestId('keepLastGroup.childResetField-value').should(
        'have.text',
        '',
      );

      // Show fields again
      cy.getByTestId('hideControl-input').clear();

      // Verify values are maintained after showing
      cy.getByTestId('submit').click();
      cy.getByTestId('keepLastGroup.childField-value').should(
        'have.text',
        'Custom child value',
      );
      cy.getByTestId('keepLastGroup.childDefaultField-value').should(
        'have.text',
        'default-child-default',
      );
      cy.getByTestId('keepLastGroup.childResetField-value').should(
        'have.text',
        '',
      );
    });

    it('should handle group with remove & last strategy correctly [remove & last group]', () => {
      setupForm([
        {
          id: 'hideControl',
          type: 'test-text-control',
          label: 'Type "hide" to hide everything',
        },
        {
          type: 'test-group',
          id: 'removeLastGroup',
          title: 'Remove but remember last value',
          hidden: 'hideControl === "hide"',
          hideStrategy: 'remove',
          valueStrategy: 'last',
          controls: [
            {
              id: 'childField',
              type: 'test-text-control',
              label: 'Child field',
              defaultValue: 'default-child',
            },
            {
              id: 'childDefaultField',
              type: 'test-text-control',
              label: 'Child with default strategy',
              defaultValue: 'default-child-default',
              valueStrategy: 'default',
            },
            {
              id: 'childResetField',
              type: 'test-text-control',
              label: 'Child with reset strategy',
              defaultValue: 'default-child-reset',
              valueStrategy: 'reset',
            },
          ],
        },
      ]);

      // Fill fields with custom values
      cy.getByTestId('childField-input').clear().type('Custom child value');
      cy.getByTestId('childDefaultField-input')
        .clear()
        .type('Custom child default value');
      cy.getByTestId('childResetField-input')
        .clear()
        .type('Custom child reset value');

      // Hide the group
      cy.getByTestId('hideControl-input').clear().type('hide');

      // Verify group is hidden and not in form value
      cy.getByTestId('removeLastGroup-title').should('not.be.visible');
      cy.getByTestId('submit').click();

      // Group and all child values are not in the form value when hidden
      cy.getByTestId('removeLastGroup.childField-value').should('not.exist');
      cy.getByTestId('removeLastGroup.childDefaultField-value').should(
        'not.exist',
      );
      cy.getByTestId('removeLastGroup.childResetField-value').should(
        'not.exist',
      );

      // Show fields again
      cy.getByTestId('hideControl-input').clear();

      // Verify values are handled according to their strategies after showing
      cy.getByTestId('submit').click();

      // Child inherits parent's last value strategy
      cy.getByTestId('removeLastGroup.childField-value').should(
        'have.text',
        'Custom child value',
      );

      // Child with default strategy overrides parent
      cy.getByTestId('removeLastGroup.childDefaultField-value').should(
        'have.text',
        'default-child-default',
      );

      // Child with reset strategy overrides parent
      cy.getByTestId('removeLastGroup.childResetField-value').should(
        'have.text',
        '',
      );
    });

    it('should handle group with keep & default strategy correctly [keep & default group]', () => {
      setupForm([
        {
          id: 'hideControl',
          type: 'test-text-control',
          label: 'Type "hide" to hide everything',
        },
        {
          type: 'test-group',
          id: 'keepDefaultGroup',
          title: 'Keep but use default value',
          hidden: 'hideControl === "hide"',
          hideStrategy: 'keep',
          valueStrategy: 'default',
          controls: [
            {
              id: 'childField',
              type: 'test-text-control',
              label: 'Child field',
              defaultValue: 'default-child',
            },
            {
              id: 'childLastField',
              type: 'test-text-control',
              label: 'Child with last strategy',
              defaultValue: 'default-child-last',
              valueStrategy: 'last',
            },
            {
              id: 'childResetField',
              type: 'test-text-control',
              label: 'Child with reset strategy',
              defaultValue: 'default-child-reset',
              valueStrategy: 'reset',
            },
          ],
        },
      ]);

      // Fill fields with custom values
      cy.getByTestId('childField-input').clear().type('Custom child value');
      cy.getByTestId('childLastField-input')
        .clear()
        .type('Custom child last value');
      cy.getByTestId('childResetField-input')
        .clear()
        .type('Custom child reset value');

      // Hide the group
      cy.getByTestId('hideControl-input').clear().type('hide');

      // Verify group is hidden but values are handled according to strategies
      cy.getByTestId('keepDefaultGroup-title').should('not.be.visible');
      cy.getByTestId('submit').click();

      // Child inherits parent's default value strategy
      cy.getByTestId('keepDefaultGroup.childField-value').should(
        'have.text',
        'default-child',
      );

      // Child with last strategy overrides parent
      cy.getByTestId('keepDefaultGroup.childLastField-value').should(
        'have.text',
        'Custom child last value',
      );

      // Child with reset strategy overrides parent
      cy.getByTestId('keepDefaultGroup.childResetField-value').should(
        'have.text',
        '',
      );

      // Show fields again
      cy.getByTestId('hideControl-input').clear();

      // Verify values are maintained after showing
      cy.getByTestId('submit').click();
      cy.getByTestId('keepDefaultGroup.childField-value').should(
        'have.text',
        'default-child',
      );
      cy.getByTestId('keepDefaultGroup.childLastField-value').should(
        'have.text',
        'Custom child last value',
      );
      cy.getByTestId('keepDefaultGroup.childResetField-value').should(
        'have.text',
        '',
      );
    });

    it('should handle group with remove & default strategy correctly [remove & default group]', () => {
      setupForm([
        {
          id: 'hideControl',
          type: 'test-text-control',
          label: 'Type "hide" to hide everything',
        },
        {
          type: 'test-group',
          id: 'removeDefaultGroup',
          title: 'Remove but use default value',
          hidden: 'hideControl === "hide"',
          hideStrategy: 'remove',
          valueStrategy: 'default',
          controls: [
            {
              id: 'childField',
              type: 'test-text-control',
              label: 'Child field',
              defaultValue: 'default-child',
            },
            {
              id: 'childLastField',
              type: 'test-text-control',
              label: 'Child with last strategy',
              defaultValue: 'default-child-last',
              valueStrategy: 'last',
            },
            {
              id: 'childResetField',
              type: 'test-text-control',
              label: 'Child with reset strategy',
              defaultValue: 'default-child-reset',
              valueStrategy: 'reset',
            },
          ],
        },
      ]);

      // Fill fields with custom values
      cy.getByTestId('childField-input').clear().type('Custom child value');
      cy.getByTestId('childLastField-input')
        .clear()
        .type('Custom child last value');
      cy.getByTestId('childResetField-input')
        .clear()
        .type('Custom child reset value');

      // Hide the group
      cy.getByTestId('hideControl-input').clear().type('hide');

      // Verify group is hidden and not in form value
      cy.getByTestId('removeDefaultGroup-title').should('not.be.visible');
      cy.getByTestId('submit').click();

      // Group and all child values are not in the form value when hidden
      cy.getByTestId('removeDefaultGroup.childField-value').should('not.exist');
      cy.getByTestId('removeDefaultGroup.childLastField-value').should(
        'not.exist',
      );
      cy.getByTestId('removeDefaultGroup.childResetField-value').should(
        'not.exist',
      );

      // Show fields again
      cy.getByTestId('hideControl-input').clear();

      // Verify values are handled according to strategies after showing
      cy.getByTestId('submit').click();

      // Child inherits parent's default value strategy
      cy.getByTestId('removeDefaultGroup.childField-value').should(
        'have.text',
        'default-child',
      );

      // Child with last strategy overrides parent
      cy.getByTestId('removeDefaultGroup.childLastField-value').should(
        'have.text',
        'Custom child last value',
      );

      // Child with reset strategy overrides parent
      cy.getByTestId('removeDefaultGroup.childResetField-value').should(
        'have.text',
        '',
      );
    });

    it('should handle group with keep & reset strategy correctly [keep & reset group]', () => {
      setupForm([
        {
          id: 'hideControl',
          type: 'test-text-control',
          label: 'Type "hide" to hide everything',
        },
        {
          type: 'test-group',
          id: 'keepResetGroup',
          title: 'Keep but reset value',
          hidden: 'hideControl === "hide"',
          hideStrategy: 'keep',
          valueStrategy: 'reset',
          controls: [
            {
              id: 'childField',
              type: 'test-text-control',
              label: 'Child field',
              defaultValue: 'default-child',
            },
            {
              id: 'childLastField',
              type: 'test-text-control',
              label: 'Child with last strategy',
              defaultValue: 'default-child-last',
              valueStrategy: 'last',
            },
            {
              id: 'childDefaultField',
              type: 'test-text-control',
              label: 'Child with default strategy',
              defaultValue: 'default-child-default',
              valueStrategy: 'default',
            },
          ],
        },
      ]);

      // Fill fields with custom values
      cy.getByTestId('childField-input').clear().type('Custom child value');
      cy.getByTestId('childLastField-input')
        .clear()
        .type('Custom child last value');
      cy.getByTestId('childDefaultField-input')
        .clear()
        .type('Custom child default value');

      // Hide the group
      cy.getByTestId('hideControl-input').clear().type('hide');

      // Verify group is hidden but values are handled according to strategies
      cy.getByTestId('keepResetGroup-title').should('not.be.visible');
      cy.getByTestId('submit').click();

      // Child inherits parent's reset value strategy
      cy.getByTestId('keepResetGroup.childField-value').should('have.text', '');

      // Child with last strategy overrides parent
      cy.getByTestId('keepResetGroup.childLastField-value').should(
        'have.text',
        'Custom child last value',
      );

      // Child with default strategy overrides parent
      cy.getByTestId('keepResetGroup.childDefaultField-value').should(
        'have.text',
        'default-child-default',
      );

      // Show fields again
      cy.getByTestId('hideControl-input').clear();

      // Verify values are maintained after showing
      cy.getByTestId('submit').click();
      cy.getByTestId('keepResetGroup.childField-value').should('have.text', '');
      cy.getByTestId('keepResetGroup.childLastField-value').should(
        'have.text',
        'Custom child last value',
      );
      cy.getByTestId('keepResetGroup.childDefaultField-value').should(
        'have.text',
        'default-child-default',
      );
    });

    it('should handle group with remove & reset strategy correctly [remove & reset group]', () => {
      setupForm([
        {
          id: 'hideControl',
          type: 'test-text-control',
          label: 'Type "hide" to hide everything',
        },
        {
          type: 'test-group',
          id: 'removeResetGroup',
          title: 'Remove and reset value',
          hidden: 'hideControl === "hide"',
          hideStrategy: 'remove',
          valueStrategy: 'reset',
          controls: [
            {
              id: 'childField',
              type: 'test-text-control',
              label: 'Child field',
              defaultValue: 'default-child',
            },
            {
              id: 'childLastField',
              type: 'test-text-control',
              label: 'Child with last strategy',
              defaultValue: 'default-child-last',
              valueStrategy: 'last',
            },
            {
              id: 'childDefaultField',
              type: 'test-text-control',
              label: 'Child with default strategy',
              defaultValue: 'default-child-default',
              valueStrategy: 'default',
            },
          ],
        },
      ]);

      // Fill fields with custom values
      cy.getByTestId('childField-input').clear().type('Custom child value');
      cy.getByTestId('childLastField-input')
        .clear()
        .type('Custom child last value');
      cy.getByTestId('childDefaultField-input')
        .clear()
        .type('Custom child default value');

      // Hide the group
      cy.getByTestId('hideControl-input').clear().type('hide');

      // Verify group is hidden and not in form value
      cy.getByTestId('removeResetGroup-title').should('not.be.visible');
      cy.getByTestId('submit').click();

      // Group and all child values are not in the form value when hidden
      cy.getByTestId('removeResetGroup.childField-value').should('not.exist');
      cy.getByTestId('removeResetGroup.childLastField-value').should(
        'not.exist',
      );
      cy.getByTestId('removeResetGroup.childDefaultField-value').should(
        'not.exist',
      );

      // Show fields again
      cy.getByTestId('hideControl-input').clear();

      // Verify values are handled according to strategies after showing
      cy.getByTestId('submit').click();

      // Child inherits parent's reset value strategy
      cy.getByTestId('removeResetGroup.childField-value').should(
        'have.text',
        '',
      );

      // Child with last strategy overrides parent
      cy.getByTestId('removeResetGroup.childLastField-value').should(
        'have.text',
        'Custom child last value',
      );

      // Child with default strategy overrides parent
      cy.getByTestId('removeResetGroup.childDefaultField-value').should(
        'have.text',
        'default-child-default',
      );
    });
  });

  describe('Nested groups and strategy inheritance', () => {
    it('should remove child group even if it has keep strategy when parent has remove [parent-child hideStrategy precedence]', () => {
      setupForm([
        {
          id: 'hideControl',
          type: 'test-text-control',
          label: 'Type "hide" to hide everything',
        },
        {
          type: 'test-group',
          id: 'parentRemove',
          title: 'Parent with Remove Strategy',
          hidden: 'hideControl === "hide"',
          hideStrategy: 'remove',
          valueStrategy: 'last',
          controls: [
            {
              id: 'parentRemoveField',
              type: 'test-text-control',
              label: 'Parent field',
              defaultValue: 'default-parent',
            },
            {
              type: 'test-group',
              id: 'childKeep',
              title: 'Child with Keep Strategy (will be ignored)',
              hideStrategy: 'keep',
              valueStrategy: 'last',
              controls: [
                {
                  id: 'childKeepField',
                  type: 'test-text-control',
                  label: 'Child field',
                  defaultValue: 'default-child',
                },
              ],
            },
          ],
        },
      ]);

      // Fill fields with custom values
      cy.getByTestId('parentRemoveField-input')
        .clear()
        .type('Custom parent value');
      cy.getByTestId('childKeepField-input').clear().type('Custom child value');

      // Hide the groups
      cy.getByTestId('hideControl-input').clear().type('hide');

      // Verify all fields are removed from DOM and values
      cy.getByTestId('parentRemove-title').should('not.be.visible');
      cy.getByTestId('submit').click();

      // Parent group is removed
      cy.getByTestId('parentRemove.parentRemoveField-value').should(
        'not.exist',
      );

      // Child group is also removed despite its keep strategy
      cy.getByTestId('parentRemove.childKeep.childKeepField-value').should(
        'not.exist',
      );

      // Show fields again
      cy.getByTestId('hideControl-input').clear();

      // Values should be restored according to valueStrategy (both use last)
      cy.getByTestId('submit').click();
      cy.getByTestId('parentRemove.parentRemoveField-value').should(
        'have.text',
        'Custom parent value',
      );
      cy.getByTestId('parentRemove.childKeep.childKeepField-value').should(
        'have.text',
        'Custom child value',
      );
    });

    it('should inherit parent group strategies when not specified [2-level nesting with inherited strategies]', () => {
      setupForm([
        {
          id: 'hideControl',
          type: 'test-text-control',
          label: 'Type "hide" to hide everything',
        },
        {
          type: 'test-group',
          id: 'parentGroup',
          title: 'Parent Group - Keep & Last',
          hidden: 'hideControl === "hide"',
          hideStrategy: 'keep',
          valueStrategy: 'last',
          controls: [
            {
              id: 'parentField',
              type: 'test-text-control',
              label: 'Parent field',
              defaultValue: 'default-parent',
            },
            {
              type: 'test-group',
              id: 'childGroup',
              title: 'Child Group - No Strategy Override',
              controls: [
                {
                  id: 'childField',
                  type: 'test-text-control',
                  label: 'Child field',
                  defaultValue: 'default-child',
                },
              ],
            },
          ],
        },
      ]);

      // Fill fields with custom values
      cy.getByTestId('parentField-input').clear().type('Custom parent value');
      cy.getByTestId('childField-input').clear().type('Custom child value');

      // Hide the groups
      cy.getByTestId('hideControl-input').clear().type('hide');

      // Submit to check values
      cy.getByTestId('submit').click();

      // Both fields should keep their last values since child inherits from parent
      cy.getByTestId('parentGroup.parentField-value').should(
        'have.text',
        'Custom parent value',
      );
      cy.getByTestId('parentGroup.childGroup.childField-value').should(
        'have.text',
        'Custom child value',
      );

      // Show fields again
      cy.getByTestId('hideControl-input').clear();

      // Submit to check values after showing
      cy.getByTestId('submit').click();

      // Values should remain the same
      cy.getByTestId('parentGroup.parentField-value').should(
        'have.text',
        'Custom parent value',
      );
      cy.getByTestId('parentGroup.childGroup.childField-value').should(
        'have.text',
        'Custom child value',
      );
    });

    it('should override parent strategy when specified in child group [2-level nesting with strategy override]', () => {
      setupForm([
        {
          id: 'hideControl',
          type: 'test-text-control',
          label: 'Type "hide" to hide everything',
        },
        {
          type: 'test-group',
          id: 'parentGroup',
          title: 'Parent Group - Keep & Last',
          hidden: 'hideControl === "hide"',
          hideStrategy: 'keep',
          valueStrategy: 'last',
          controls: [
            {
              id: 'parentField',
              type: 'test-text-control',
              label: 'Parent field',
              defaultValue: 'default-parent',
            },
            {
              type: 'test-group',
              id: 'childGroup',
              title: 'Child Group - With Strategy Override',
              valueStrategy: 'default',
              controls: [
                {
                  id: 'childField',
                  type: 'test-text-control',
                  label: 'Child field',
                  defaultValue: 'default-child',
                },
              ],
            },
          ],
        },
      ]);

      // Fill fields with custom values
      cy.getByTestId('parentField-input').clear().type('Custom parent value');
      cy.getByTestId('childField-input').clear().type('Custom child value');

      // Hide the groups
      cy.getByTestId('hideControl-input').clear().type('hide');

      // Submit to check values
      cy.getByTestId('submit').click();

      // Parent field keeps last value, child reverts to default
      cy.getByTestId('parentGroup.parentField-value').should(
        'have.text',
        'Custom parent value',
      );
      cy.getByTestId('parentGroup.childGroup.childField-value').should(
        'have.text',
        'default-child',
      );

      // Show fields again
      cy.getByTestId('hideControl-input').clear();

      // Submit to check values after showing
      cy.getByTestId('submit').click();

      // Values should remain the same
      cy.getByTestId('parentGroup.parentField-value').should(
        'have.text',
        'Custom parent value',
      );
      cy.getByTestId('parentGroup.childGroup.childField-value').should(
        'have.text',
        'default-child',
      );
    });

    it('should correctly handle valueStrategy inheritance through 3 levels [3-level nesting with valueStrategy inheritance]', () => {
      setupForm([
        {
          id: 'hideControl',
          type: 'test-text-control',
          label: 'Type "hide" to hide everything',
        },
        {
          type: 'test-group',
          id: 'grandparentGroup',
          title: 'Grandparent Group - Keep & Default',
          hidden: 'hideControl === "hide"',
          hideStrategy: 'keep',
          valueStrategy: 'default',
          controls: [
            {
              id: 'grandparentField',
              type: 'test-text-control',
              label: 'Grandparent field',
              defaultValue: 'default-grandparent',
            },
            {
              type: 'test-group',
              id: 'parentGroup',
              title: 'Parent Group - Override to Last',
              valueStrategy: 'last',
              controls: [
                {
                  id: 'parentField',
                  type: 'test-text-control',
                  label: 'Parent field',
                  defaultValue: 'default-parent',
                },
                {
                  type: 'test-group',
                  id: 'childGroup',
                  title: 'Child Group - No Strategy Override',
                  controls: [
                    {
                      id: 'childField',
                      type: 'test-text-control',
                      label: 'Child field',
                      defaultValue: 'default-child',
                    },
                  ],
                },
                {
                  type: 'test-group',
                  id: 'childGroupWithOverride',
                  title: 'Child Group - Reset Override',
                  valueStrategy: 'reset',
                  controls: [
                    {
                      id: 'childOverrideField',
                      type: 'test-text-control',
                      label: 'Child override field',
                      defaultValue: 'default-child-override',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]);

      // Fill fields with custom values
      cy.getByTestId('grandparentField-input')
        .clear()
        .type('Custom grandparent value');
      cy.getByTestId('parentField-input').clear().type('Custom parent value');
      cy.getByTestId('childField-input').clear().type('Custom child value');
      cy.getByTestId('childOverrideField-input')
        .clear()
        .type('Custom child override value');

      // Hide all groups
      cy.getByTestId('hideControl-input').clear().type('hide');

      // Submit to check values
      cy.getByTestId('submit').click();

      // Grandparent uses default strategy
      cy.getByTestId('grandparentGroup.grandparentField-value').should(
        'have.text',
        'default-grandparent',
      );

      // Parent overrides to last strategy
      cy.getByTestId('grandparentGroup.parentGroup.parentField-value').should(
        'have.text',
        'Custom parent value',
      );

      // Child inherits parent's last strategy
      cy.getByTestId(
        'grandparentGroup.parentGroup.childGroup.childField-value',
      ).should('have.text', 'Custom child value');

      // Child with override uses reset strategy
      cy.getByTestId(
        'grandparentGroup.parentGroup.childGroupWithOverride.childOverrideField-value',
      ).should('have.text', '');

      // Show fields again
      cy.getByTestId('hideControl-input').clear();

      // Submit to check values after showing
      cy.getByTestId('submit').click();

      // Values should remain the same
      cy.getByTestId('grandparentGroup.grandparentField-value').should(
        'have.text',
        'default-grandparent',
      );
      cy.getByTestId('grandparentGroup.parentGroup.parentField-value').should(
        'have.text',
        'Custom parent value',
      );
      cy.getByTestId(
        'grandparentGroup.parentGroup.childGroup.childField-value',
      ).should('have.text', 'Custom child value');
      cy.getByTestId(
        'grandparentGroup.parentGroup.childGroupWithOverride.childOverrideField-value',
      ).should('have.text', '');
    });

    it('should remove all nested content when parent group is removed [hideStrategy inheritance with nested groups]', () => {
      setupForm([
        {
          id: 'hideControl',
          type: 'test-text-control',
          label: 'Type "hide" to hide everything',
        },
        {
          type: 'test-group',
          id: 'outerGroup',
          title: 'Outer Group - Remove',
          hidden: 'hideControl === "hide"',
          hideStrategy: 'remove',
          valueStrategy: 'last',
          controls: [
            {
              id: 'outerField',
              type: 'test-text-control',
              label: 'Outer field',
              defaultValue: 'default-outer',
            },
            {
              type: 'test-group',
              id: 'middleGroup',
              title:
                'Middle Group - Keep Override (ignored when parent is removed)',
              hideStrategy: 'keep',
              controls: [
                {
                  id: 'middleField',
                  type: 'test-text-control',
                  label: 'Middle field',
                  defaultValue: 'default-middle',
                },
                {
                  type: 'test-group',
                  id: 'innerGroup',
                  title: 'Inner Group - No Strategy Override',
                  controls: [
                    {
                      id: 'innerField',
                      type: 'test-text-control',
                      label: 'Inner field',
                      defaultValue: 'default-inner',
                    },
                  ],
                },
                // Field with override
                {
                  id: 'middleOverrideField',
                  type: 'test-text-control',
                  label: 'Middle field with override',
                  defaultValue: 'default-middle-override',
                  valueStrategy: 'default',
                },
              ],
            },
          ],
        },
      ]);

      // Fill fields with custom values
      cy.getByTestId('outerField-input').clear().type('Custom outer value');
      cy.getByTestId('middleField-input').clear().type('Custom middle value');
      cy.getByTestId('innerField-input').clear().type('Custom inner value');
      cy.getByTestId('middleOverrideField-input')
        .clear()
        .type('Custom middle override value');

      // Hide all groups
      cy.getByTestId('hideControl-input').clear().type('hide');

      // Submit to check values
      cy.getByTestId('submit').click();

      // Outer group is hidden with remove strategy, so all nested content is also removed
      cy.getByTestId('outerGroup.outerField-value').should('not.exist');
      cy.getByTestId('outerGroup.middleGroup.middleField-value').should(
        'not.exist',
      );
      cy.getByTestId(
        'outerGroup.middleGroup.innerGroup.innerField-value',
      ).should('not.exist');
      cy.getByTestId('outerGroup.middleGroup.middleOverrideField-value').should(
        'not.exist',
      );

      // Show fields again
      cy.getByTestId('hideControl-input').clear();

      // Submit to check values after showing - they should follow valueStrategy
      cy.getByTestId('submit').click();

      // Outer group uses last strategy
      cy.getByTestId('outerGroup.outerField-value').should(
        'have.text',
        'Custom outer value',
      );

      // Middle group inherits last strategy from outer group
      cy.getByTestId('outerGroup.middleGroup.middleField-value').should(
        'have.text',
        'Custom middle value',
      );

      // Inner group inherits last strategy from middle group
      cy.getByTestId(
        'outerGroup.middleGroup.innerGroup.innerField-value',
      ).should('have.text', 'Custom inner value');

      // Field with value strategy override uses default
      cy.getByTestId('outerGroup.middleGroup.middleOverrideField-value').should(
        'have.text',
        'default-middle-override',
      );
    });

    it('should correctly handle complex inheritance patterns [complex 3-level nesting with mixed strategies]', () => {
      setupForm([
        {
          id: 'hideControl',
          type: 'test-text-control',
          label: 'Type "hide" to hide everything',
        },
        {
          type: 'test-group',
          id: 'level1',
          title: 'Level 1 - Keep & Default',
          hidden: 'hideControl === "hide"',
          hideStrategy: 'keep',
          valueStrategy: 'default',
          controls: [
            {
              id: 'level1Field',
              type: 'test-text-control',
              label: 'Level 1 field',
              defaultValue: 'default-level1',
            },
            {
              id: 'level1FieldOverride',
              type: 'test-text-control',
              label: 'Level 1 field with override',
              defaultValue: 'default-level1-override',
              valueStrategy: 'last',
            },
            {
              type: 'test-group',
              id: 'level2A',
              title: 'Level 2A - Inherited from Level 1',
              controls: [
                {
                  id: 'level2AField',
                  type: 'test-text-control',
                  label: 'Level 2A field',
                  defaultValue: 'default-level2A',
                },
              ],
            },
            {
              type: 'test-group',
              id: 'level2B',
              title: 'Level 2B - Last Override',
              valueStrategy: 'last',
              controls: [
                {
                  id: 'level2BField',
                  type: 'test-text-control',
                  label: 'Level 2B field',
                  defaultValue: 'default-level2B',
                },
                {
                  type: 'test-group',
                  id: 'level3A',
                  title: 'Level 3A - Inherited from Level 2B',
                  controls: [
                    {
                      id: 'level3AField',
                      type: 'test-text-control',
                      label: 'Level 3A field',
                      defaultValue: 'default-level3A',
                    },
                  ],
                },
                {
                  type: 'test-group',
                  id: 'level3B',
                  title: 'Level 3B - Reset',
                  valueStrategy: 'reset',
                  controls: [
                    {
                      id: 'level3BField',
                      type: 'test-text-control',
                      label: 'Level 3B field',
                      defaultValue: 'default-level3B',
                    },
                    {
                      id: 'level3BFieldOverride',
                      type: 'test-text-control',
                      label: 'Level 3B field with override',
                      defaultValue: 'default-level3B-override',
                      valueStrategy: 'default',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]);

      // Fill all fields with custom values
      cy.getByTestId('level1Field-input').clear().type('Custom level1 value');
      cy.getByTestId('level1FieldOverride-input')
        .clear()
        .type('Custom level1 override value');
      cy.getByTestId('level2AField-input').clear().type('Custom level2A value');
      cy.getByTestId('level2BField-input').clear().type('Custom level2B value');
      cy.getByTestId('level3AField-input').clear().type('Custom level3A value');
      cy.getByTestId('level3BField-input').clear().type('Custom level3B value');
      cy.getByTestId('level3BFieldOverride-input')
        .clear()
        .type('Custom level3B override value');

      // Hide all groups
      cy.getByTestId('hideControl-input').clear().type('hide');

      // Submit to check values
      cy.getByTestId('submit').click();

      // Level 1 group is hidden with keep strategy
      // Level 1 uses default strategy
      cy.getByTestId('level1.level1Field-value').should(
        'have.text',
        'default-level1',
      );

      // Level 1 field with override uses last
      cy.getByTestId('level1.level1FieldOverride-value').should(
        'have.text',
        'Custom level1 override value',
      );

      // Level 2A inherits keep & default from Level 1
      cy.getByTestId('level1.level2A.level2AField-value').should(
        'have.text',
        'default-level2A',
      );

      // Level 2B inherits keep from Level 1 but overrides value to last
      cy.getByTestId('level1.level2B.level2BField-value').should(
        'have.text',
        'Custom level2B value',
      );

      // Level 3A inherits keep & last from Level 2B
      cy.getByTestId('level1.level2B.level3A.level3AField-value').should(
        'have.text',
        'Custom level3A value',
      );

      // Level 3B inherits keep from 2B but overrides value to reset
      cy.getByTestId('level1.level2B.level3B.level3BField-value').should(
        'have.text',
        '',
      );

      // Field in Level 3B overrides to default
      cy.getByTestId(
        'level1.level2B.level3B.level3BFieldOverride-value',
      ).should('have.text', 'default-level3B-override');

      // Show fields again
      cy.getByTestId('hideControl-input').clear();

      // Submit to check values after showing - should be the same
      cy.getByTestId('submit').click();

      cy.getByTestId('level1.level1Field-value').should(
        'have.text',
        'default-level1',
      );
      cy.getByTestId('level1.level1FieldOverride-value').should(
        'have.text',
        'Custom level1 override value',
      );
      cy.getByTestId('level1.level2A.level2AField-value').should(
        'have.text',
        'default-level2A',
      );
      cy.getByTestId('level1.level2B.level2BField-value').should(
        'have.text',
        'Custom level2B value',
      );
      cy.getByTestId('level1.level2B.level3A.level3AField-value').should(
        'have.text',
        'Custom level3A value',
      );
      cy.getByTestId('level1.level2B.level3B.level3BField-value').should(
        'have.text',
        '',
      );
      cy.getByTestId(
        'level1.level2B.level3B.level3BFieldOverride-value',
      ).should('have.text', 'default-level3B-override');
    });
  });

  describe('Form Visibility Edge Cases', () => {
    it('should maintain correct values through multiple hide/show cycles [multiple hide/show cycles]', () => {
      setupForm([
        {
          id: 'hideControl',
          type: 'test-text-control',
          label: 'Type "hide" to hide everything',
        },
        {
          id: 'lastField',
          type: 'test-text-control',
          label: 'Field with last strategy',
          defaultValue: 'default-last',
          hidden: 'hideControl === "hide"',
          hideStrategy: 'keep',
          valueStrategy: 'last',
        },
        {
          id: 'defaultField',
          type: 'test-text-control',
          label: 'Field with default strategy',
          defaultValue: 'default-default',
          hidden: 'hideControl === "hide"',
          hideStrategy: 'keep',
          valueStrategy: 'default',
        },
        {
          id: 'resetField',
          type: 'test-text-control',
          label: 'Field with reset strategy',
          defaultValue: 'default-reset',
          hidden: 'hideControl === "hide"',
          hideStrategy: 'keep',
          valueStrategy: 'reset',
        },
      ]);

      // First cycle - set initial values
      cy.getByTestId('lastField-input').clear().type('custom-last-1');
      cy.getByTestId('defaultField-input').clear().type('custom-default-1');
      cy.getByTestId('resetField-input').clear().type('custom-reset-1');

      // First hide
      cy.getByTestId('hideControl-input').clear().type('hide');
      cy.getByTestId('submit').click();

      // Verify values during first hide
      cy.getByTestId('lastField-value').should('have.text', 'custom-last-1');
      cy.getByTestId('defaultField-value').should(
        'have.text',
        'default-default',
      );
      cy.getByTestId('resetField-value').should('have.text', '');

      // First show
      cy.getByTestId('hideControl-input').clear();

      // Set new values for second cycle
      cy.getByTestId('lastField-input').clear().type('custom-last-2');
      cy.getByTestId('defaultField-input').clear().type('custom-default-2');
      cy.getByTestId('resetField-input').clear().type('custom-reset-2');

      // Second hide
      cy.getByTestId('hideControl-input').clear().type('hide');
      cy.getByTestId('submit').click();

      // Verify values during second hide
      cy.getByTestId('lastField-value').should('have.text', 'custom-last-2');
      cy.getByTestId('defaultField-value').should(
        'have.text',
        'default-default',
      );
      cy.getByTestId('resetField-value').should('have.text', '');

      // Second show
      cy.getByTestId('hideControl-input').clear();
      cy.getByTestId('submit').click();

      // Verify values after second show
      cy.getByTestId('lastField-value').should('have.text', 'custom-last-2');
      cy.getByTestId('defaultField-value').should(
        'have.text',
        'default-default',
      );
      cy.getByTestId('resetField-value').should('have.text', '');
    });

    it('should handle empty or undefined default values correctly [empty or undefined default values]', () => {
      setupForm([
        {
          id: 'hideControl',
          type: 'test-text-control',
          label: 'Type "hide" to hide everything',
        },
        {
          id: 'noDefaultField',
          type: 'test-text-control',
          label: 'Field with no default value',
          hidden: 'hideControl === "hide"',
          hideStrategy: 'keep',
          valueStrategy: 'default',
        },
        {
          id: 'emptyDefaultField',
          type: 'test-text-control',
          label: 'Field with empty default value',
          defaultValue: '',
          hidden: 'hideControl === "hide"',
          hideStrategy: 'keep',
          valueStrategy: 'default',
        },
      ]);

      // Set custom values
      cy.getByTestId('noDefaultField-input').clear().type('custom-no-default');
      cy.getByTestId('emptyDefaultField-input')
        .clear()
        .type('custom-empty-default');

      // Hide fields
      cy.getByTestId('hideControl-input').clear().type('hide');
      cy.getByTestId('submit').click();

      // Verify fields revert to empty string when default is empty or undefined
      cy.getByTestId('noDefaultField-value').should('have.text', '');
      cy.getByTestId('emptyDefaultField-value').should('have.text', '');

      // Show fields again
      cy.getByTestId('hideControl-input').clear();
      cy.getByTestId('submit').click();

      // Verify fields remain empty
      cy.getByTestId('noDefaultField-value').should('have.text', '');
      cy.getByTestId('emptyDefaultField-value').should('have.text', '');
    });
  });
});
