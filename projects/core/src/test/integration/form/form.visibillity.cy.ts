import { setupForm } from '../../helper/test';

describe('Form Visibility Strategies', () => {
  describe('Single field strategies', () => {
    describe('keep & last', () => {
      beforeEach(() => {
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
            hide: 'hideControl === "hide"',
            hideStrategy: 'keep',
            valueStrategy: 'last',
          },
        ]);
      });

      it('should keep the field value when hidden and shown again', () => {
        const customValue = 'Custom keep & last value';

        // Fill the field with custom value
        fillInput('keepLastField', customValue);

        // Hide the field
        hideControls();

        // Verify field is hidden but value is preserved
        cy.getByTestId('keepLastField-input').should('not.exist');
        submitForm();
        verifyFieldValue('keepLastField', customValue);

        // Show field again
        showControls();

        // Verify field appears with the last value
        submitForm();
        verifyFieldValue('keepLastField', customValue);
      });
    });

    describe('remove & last', () => {
      beforeEach(() => {
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
            hide: 'hideControl === "hide"',
            hideStrategy: 'remove',
            valueStrategy: 'last',
          },
        ]);
      });

      it('should remember the field value when hidden and shown again', () => {
        const customValue = 'Custom remove & last value';

        // Fill the field with custom value
        fillInput('removeLastField', customValue);

        // Hide the field
        hideControls();

        // Verify field is hidden and not in the form value when hidden
        cy.getByTestId('removeLastField-input').should('not.exist');
        submitForm();
        verifyFieldNotExist('removeLastField');

        // Show field again
        showControls();

        // Verify field appears with the last value
        submitForm();
        verifyFieldValue('removeLastField', customValue);
      });
    });

    describe('keep & default', () => {
      const defaultValue = 'default-keep-default';

      beforeEach(() => {
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
            hide: 'hideControl === "hide"',
            hideStrategy: 'keep',
            valueStrategy: 'default',
          },
        ]);
      });

      it('should revert to default value when hidden', () => {
        const customValue = 'Custom keep & default value';

        // Fill the field with custom value
        fillInput('keepDefaultField', customValue);

        // Hide the field
        hideControls();

        // Verify field is hidden but value reverts to default
        cy.getByTestId('keepDefaultField-input').should('not.exist');
        submitForm();
        verifyFieldValue('keepDefaultField', defaultValue);

        // Show field again
        showControls();

        // Verify field appears with default value
        submitForm();
        verifyFieldValue('keepDefaultField', defaultValue);
      });
    });

    describe('remove & default', () => {
      const defaultValue = 'default-remove-default';

      beforeEach(() => {
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
            hide: 'hideControl === "hide"',
            hideStrategy: 'remove',
            valueStrategy: 'default',
          },
        ]);
      });

      it('should use default value when shown again', () => {
        const customValue = 'Custom remove & default value';

        // Fill the field with custom value
        fillInput('removeDefaultField', customValue);

        // Hide the field
        hideControls();

        // Verify field is hidden and not in form value
        cy.getByTestId('removeDefaultField-input').should('not.exist');
        submitForm();
        verifyFieldNotExist('removeDefaultField');

        // Show field again
        showControls();

        // Verify field appears with default value
        submitForm();
        verifyFieldValue('removeDefaultField', defaultValue);
      });
    });

    describe('keep & reset', () => {
      beforeEach(() => {
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
            hide: 'hideControl === "hide"',
            hideStrategy: 'keep',
            valueStrategy: 'reset',
          },
        ]);
      });

      it('should reset value when hidden', () => {
        const customValue = 'Custom keep & reset value';

        // Fill the field with custom value
        fillInput('keepResetField', customValue);

        // Hide the field
        hideControls();

        // Verify field is hidden but value is reset to empty
        cy.getByTestId('keepResetField-input').should('not.exist');
        submitForm();
        verifyFieldValue('keepResetField', '');

        // Show field again
        showControls();

        // Verify field appears with empty value
        submitForm();
        verifyFieldValue('keepResetField', '');
      });
    });

    describe('remove & reset', () => {
      beforeEach(() => {
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
            hide: 'hideControl === "hide"',
            hideStrategy: 'remove',
            valueStrategy: 'reset',
          },
        ]);
      });

      it('should have empty value when shown again', () => {
        const customValue = 'Custom remove & reset value';

        // Fill the field with custom value
        fillInput('removeResetField', customValue);

        // Hide the field
        hideControls();

        // Verify field is hidden and not in form value
        cy.getByTestId('removeResetField-input').should('not.exist');
        submitForm();
        verifyFieldNotExist('removeResetField');

        // Show field again
        showControls();

        // Verify field appears with empty value
        submitForm();
        verifyFieldValue('removeResetField', '');
      });
    });
  });

  describe('Group field strategies', () => {
    describe('keep & last group', () => {
      beforeEach(() => {
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
            hide: 'hideControl === "hide"',
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
      });

      it('should handle group with keep & last strategy correctly', () => {
        // Fill fields with custom values
        fillInput('childField', 'Custom child value');
        fillInput('childDefaultField', 'Custom child default value');
        fillInput('childResetField', 'Custom child reset value');

        // Hide the group
        hideControls();

        // Verify group is hidden but values are handled according to their strategies
        cy.getByTestId('keepLastGroup-title').should('not.be.visible');
        submitForm();

        // Child inherits parent's last value strategy
        verifyFieldValue('keepLastGroup.childField', 'Custom child value');

        // Child with default strategy overrides parent
        verifyFieldValue(
          'keepLastGroup.childDefaultField',
          'default-child-default',
        );

        // Child with reset strategy overrides parent
        verifyFieldValue('keepLastGroup.childResetField', '');

        // Show fields again
        showControls();

        // Verify values are maintained after showing
        submitForm();
        verifyFieldValue('keepLastGroup.childField', 'Custom child value');
        verifyFieldValue(
          'keepLastGroup.childDefaultField',
          'default-child-default',
        );
        verifyFieldValue('keepLastGroup.childResetField', '');
      });
    });

    describe('remove & last group', () => {
      beforeEach(() => {
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
            hide: 'hideControl === "hide"',
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
      });

      it('should handle group with remove & last strategy correctly', () => {
        // Fill fields with custom values
        fillInput('childField', 'Custom child value');
        fillInput('childDefaultField', 'Custom child default value');
        fillInput('childResetField', 'Custom child reset value');

        // Hide the group
        hideControls();

        // Verify group is hidden and not in form value
        cy.getByTestId('removeLastGroup-title').should('not.be.visible');
        submitForm();

        // Group and all child values are not in the form value when hidden
        verifyFieldNotExist('removeLastGroup.childField');
        verifyFieldNotExist('removeLastGroup.childDefaultField');
        verifyFieldNotExist('removeLastGroup.childResetField');

        // Show fields again
        showControls();

        // Verify values are handled according to their strategies after showing
        submitForm();

        // Child inherits parent's last value strategy
        verifyFieldValue('removeLastGroup.childField', 'Custom child value');

        // Child with default strategy overrides parent
        verifyFieldValue(
          'removeLastGroup.childDefaultField',
          'default-child-default',
        );

        // Child with reset strategy overrides parent
        verifyFieldValue('removeLastGroup.childResetField', '');
      });
    });

    describe('keep & default group', () => {
      beforeEach(() => {
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
            hide: 'hideControl === "hide"',
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
      });

      it('should handle group with keep & default strategy correctly', () => {
        // Fill fields with custom values
        fillInput('childField', 'Custom child value');
        fillInput('childLastField', 'Custom child last value');
        fillInput('childResetField', 'Custom child reset value');

        // Hide the group
        hideControls();

        // Verify group is hidden but values are handled according to strategies
        cy.getByTestId('keepDefaultGroup-title').should('not.be.visible');
        submitForm();

        // Child inherits parent's default value strategy
        verifyFieldValue('keepDefaultGroup.childField', 'default-child');

        // Child with last strategy overrides parent
        verifyFieldValue(
          'keepDefaultGroup.childLastField',
          'Custom child last value',
        );

        // Child with reset strategy overrides parent
        verifyFieldValue('keepDefaultGroup.childResetField', '');

        // Show fields again
        showControls();

        // Verify values are maintained after showing
        submitForm();
        verifyFieldValue('keepDefaultGroup.childField', 'default-child');
        verifyFieldValue(
          'keepDefaultGroup.childLastField',
          'Custom child last value',
        );
        verifyFieldValue('keepDefaultGroup.childResetField', '');
      });
    });

    describe('remove & default group', () => {
      beforeEach(() => {
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
            hide: 'hideControl === "hide"',
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
      });

      it('should handle group with remove & default strategy correctly', () => {
        // Fill fields with custom values
        fillInput('childField', 'Custom child value');
        fillInput('childLastField', 'Custom child last value');
        fillInput('childResetField', 'Custom child reset value');

        // Hide the group
        hideControls();

        // Verify group is hidden and not in form value
        cy.getByTestId('removeDefaultGroup-title').should('not.be.visible');
        submitForm();

        // Group and all child values are not in the form value when hidden
        verifyFieldNotExist('removeDefaultGroup.childField');
        verifyFieldNotExist('removeDefaultGroup.childLastField');
        verifyFieldNotExist('removeDefaultGroup.childResetField');

        // Show fields again
        showControls();

        // Verify values are handled according to strategies after showing
        submitForm();

        // Child inherits parent's default value strategy
        verifyFieldValue('removeDefaultGroup.childField', 'default-child');

        // Child with last strategy overrides parent
        verifyFieldValue(
          'removeDefaultGroup.childLastField',
          'Custom child last value',
        );

        // Child with reset strategy overrides parent
        verifyFieldValue('removeDefaultGroup.childResetField', '');
      });
    });

    describe('keep & reset group', () => {
      beforeEach(() => {
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
            hide: 'hideControl === "hide"',
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
      });

      it('should handle group with keep & reset strategy correctly', () => {
        // Fill fields with custom values
        fillInput('childField', 'Custom child value');
        fillInput('childLastField', 'Custom child last value');
        fillInput('childDefaultField', 'Custom child default value');

        // Hide the group
        hideControls();

        // Verify group is hidden but values are handled according to strategies
        cy.getByTestId('keepResetGroup-title').should('not.be.visible');
        submitForm();

        // Child inherits parent's reset value strategy
        verifyFieldValue('keepResetGroup.childField', '');

        // Child with last strategy overrides parent
        verifyFieldValue(
          'keepResetGroup.childLastField',
          'Custom child last value',
        );

        // Child with default strategy overrides parent
        verifyFieldValue(
          'keepResetGroup.childDefaultField',
          'default-child-default',
        );

        // Show fields again
        showControls();

        // Verify values are maintained after showing
        submitForm();
        verifyFieldValue('keepResetGroup.childField', '');
        verifyFieldValue(
          'keepResetGroup.childLastField',
          'Custom child last value',
        );
        verifyFieldValue(
          'keepResetGroup.childDefaultField',
          'default-child-default',
        );
      });
    });

    describe('remove & reset group', () => {
      beforeEach(() => {
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
            hide: 'hideControl === "hide"',
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
      });

      it('should handle group with remove & reset strategy correctly', () => {
        // Fill fields with custom values
        fillInput('childField', 'Custom child value');
        fillInput('childLastField', 'Custom child last value');
        fillInput('childDefaultField', 'Custom child default value');

        // Hide the group
        hideControls();

        // Verify group is hidden and not in form value
        cy.getByTestId('removeResetGroup-title').should('not.be.visible');
        submitForm();

        // Group and all child values are not in the form value when hidden
        verifyFieldNotExist('removeResetGroup.childField');
        verifyFieldNotExist('removeResetGroup.childLastField');
        verifyFieldNotExist('removeResetGroup.childDefaultField');

        // Show fields again
        showControls();

        // Verify values are handled according to strategies after showing
        submitForm();

        // Child inherits parent's reset value strategy
        verifyFieldValue('removeResetGroup.childField', '');

        // Child with last strategy overrides parent
        verifyFieldValue(
          'removeResetGroup.childLastField',
          'Custom child last value',
        );

        // Child with default strategy overrides parent
        verifyFieldValue(
          'removeResetGroup.childDefaultField',
          'default-child-default',
        );
      });
    });
  });

  describe('Nested groups and strategy inheritance', () => {
    describe('parent-child hideStrategy precedence', () => {
      beforeEach(() => {
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
            hide: 'hideControl === "hide"',
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
      });

      it('should remove child group even if it has keep strategy when parent has remove', () => {
        // Fill fields with custom values
        fillInput('parentRemoveField', 'Custom parent value');
        fillInput('childKeepField', 'Custom child value');

        // Hide the groups
        hideControls();

        // Verify all fields are removed from DOM and values
        cy.getByTestId('parentRemove-title').should('not.be.visible');
        submitForm();

        // Parent group is removed
        verifyFieldNotExist('parentRemove.parentRemoveField');

        // Child group is also removed despite its keep strategy
        verifyFieldNotExist('parentRemove.childKeep.childKeepField');

        // Show fields again
        showControls();

        // Values should be restored according to valueStrategy (both use last)
        submitForm();
        verifyFieldValue(
          'parentRemove.parentRemoveField',
          'Custom parent value',
        );
        verifyFieldValue(
          'parentRemove.childKeep.childKeepField',
          'Custom child value',
        );
      });
    });
    describe('2-level nesting with inherited strategies', () => {
      beforeEach(() => {
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
            hide: 'hideControl === "hide"',
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
      });

      it('should inherit parent group strategies when not specified', () => {
        // Fill fields with custom values
        fillInput('parentField', 'Custom parent value');
        fillInput('childField', 'Custom child value');

        // Hide the groups
        hideControls();

        // Submit to check values
        submitForm();

        // Both fields should keep their last values since child inherits from parent
        verifyFieldValue('parentGroup.parentField', 'Custom parent value');
        verifyFieldValue(
          'parentGroup.childGroup.childField',
          'Custom child value',
        );

        // Show fields again
        showControls();

        // Submit to check values after showing
        submitForm();

        // Values should remain the same
        verifyFieldValue('parentGroup.parentField', 'Custom parent value');
        verifyFieldValue(
          'parentGroup.childGroup.childField',
          'Custom child value',
        );
      });
    });

    describe('2-level nesting with strategy override', () => {
      beforeEach(() => {
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
            hide: 'hideControl === "hide"',
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
      });

      it('should override parent strategy when specified in child group', () => {
        // Fill fields with custom values
        fillInput('parentField', 'Custom parent value');
        fillInput('childField', 'Custom child value');

        // Hide the groups
        hideControls();

        // Submit to check values
        submitForm();

        // Parent field keeps last value, child reverts to default
        verifyFieldValue('parentGroup.parentField', 'Custom parent value');
        verifyFieldValue('parentGroup.childGroup.childField', 'default-child');

        // Show fields again
        showControls();

        // Submit to check values after showing
        submitForm();

        // Values should remain the same
        verifyFieldValue('parentGroup.parentField', 'Custom parent value');
        verifyFieldValue('parentGroup.childGroup.childField', 'default-child');
      });
    });

    describe('3-level nesting with valueStrategy inheritance', () => {
      beforeEach(() => {
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
            hide: 'hideControl === "hide"',
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
      });

      it('should correctly handle valueStrategy inheritance through 3 levels', () => {
        // Fill fields with custom values
        fillInput('grandparentField', 'Custom grandparent value');
        fillInput('parentField', 'Custom parent value');
        fillInput('childField', 'Custom child value');
        fillInput('childOverrideField', 'Custom child override value');

        // Hide all groups
        hideControls();

        // Submit to check values
        submitForm();

        // Grandparent uses default strategy
        verifyFieldValue(
          'grandparentGroup.grandparentField',
          'default-grandparent',
        );

        // Parent overrides to last strategy
        verifyFieldValue(
          'grandparentGroup.parentGroup.parentField',
          'Custom parent value',
        );

        // Child inherits parent's last strategy
        verifyFieldValue(
          'grandparentGroup.parentGroup.childGroup.childField',
          'Custom child value',
        );

        // Child with override uses reset strategy
        verifyFieldValue(
          'grandparentGroup.parentGroup.childGroupWithOverride.childOverrideField',
          '',
        );

        // Show fields again
        showControls();

        // Submit to check values after showing
        submitForm();

        // Values should remain the same
        verifyFieldValue(
          'grandparentGroup.grandparentField',
          'default-grandparent',
        );
        verifyFieldValue(
          'grandparentGroup.parentGroup.parentField',
          'Custom parent value',
        );
        verifyFieldValue(
          'grandparentGroup.parentGroup.childGroup.childField',
          'Custom child value',
        );
        verifyFieldValue(
          'grandparentGroup.parentGroup.childGroupWithOverride.childOverrideField',
          '',
        );
      });
    });

    describe('hideStrategy inheritance with nested groups', () => {
      beforeEach(() => {
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
            hide: 'hideControl === "hide"',
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
      });

      it('should remove all nested content when parent group is removed', () => {
        // Fill fields with custom values
        fillInput('outerField', 'Custom outer value');
        fillInput('middleField', 'Custom middle value');
        fillInput('innerField', 'Custom inner value');
        fillInput('middleOverrideField', 'Custom middle override value');

        // Hide all groups
        hideControls();

        // Submit to check values
        submitForm();

        // Outer group is hidden with remove strategy, so all nested content is also removed
        verifyFieldNotExist('outerGroup.outerField');
        verifyFieldNotExist('outerGroup.middleGroup.middleField');
        verifyFieldNotExist('outerGroup.middleGroup.innerGroup.innerField');
        verifyFieldNotExist('outerGroup.middleGroup.middleOverrideField');

        // Show fields again
        showControls();

        // Submit to check values after showing - they should follow valueStrategy
        submitForm();

        // Outer group uses last strategy
        verifyFieldValue('outerGroup.outerField', 'Custom outer value');

        // Middle group inherits last strategy from outer group
        verifyFieldValue(
          'outerGroup.middleGroup.middleField',
          'Custom middle value',
        );

        // Inner group inherits last strategy from middle group
        verifyFieldValue(
          'outerGroup.middleGroup.innerGroup.innerField',
          'Custom inner value',
        );

        // Field with value strategy override uses default
        verifyFieldValue(
          'outerGroup.middleGroup.middleOverrideField',
          'default-middle-override',
        );
      });
    });

    describe('complex 3-level nesting with mixed strategies', () => {
      beforeEach(() => {
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
            hide: 'hideControl === "hide"',
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
      });

      it('should correctly handle complex inheritance patterns', () => {
        // Fill all fields with custom values
        fillInput('level1Field', 'Custom level1 value');
        fillInput('level1FieldOverride', 'Custom level1 override value');
        fillInput('level2AField', 'Custom level2A value');
        fillInput('level2BField', 'Custom level2B value');
        fillInput('level3AField', 'Custom level3A value');
        fillInput('level3BField', 'Custom level3B value');
        fillInput('level3BFieldOverride', 'Custom level3B override value');

        // Hide all groups
        hideControls();

        // Submit to check values
        submitForm();

        // Level 1 group is hidden with keep strategy
        // Level 1 uses default strategy
        verifyFieldValue('level1.level1Field', 'default-level1');

        // Level 1 field with override uses last
        verifyFieldValue(
          'level1.level1FieldOverride',
          'Custom level1 override value',
        );

        // Level 2A inherits keep & default from Level 1
        verifyFieldValue('level1.level2A.level2AField', 'default-level2A');

        // Level 2B inherits keep from Level 1 but overrides value to last
        verifyFieldValue('level1.level2B.level2BField', 'Custom level2B value');

        // Level 3A inherits keep & last from Level 2B
        verifyFieldValue(
          'level1.level2B.level3A.level3AField',
          'Custom level3A value',
        );

        // Level 3B inherits keep from 2B but overrides value to reset
        verifyFieldValue('level1.level2B.level3B.level3BField', '');

        // Field in Level 3B overrides to default
        verifyFieldValue(
          'level1.level2B.level3B.level3BFieldOverride',
          'default-level3B-override',
        );

        // Show fields again
        showControls();

        // Submit to check values after showing - should be the same
        submitForm();

        verifyFieldValue('level1.level1Field', 'default-level1');
        verifyFieldValue(
          'level1.level1FieldOverride',
          'Custom level1 override value',
        );
        verifyFieldValue('level1.level2A.level2AField', 'default-level2A');
        verifyFieldValue('level1.level2B.level2BField', 'Custom level2B value');
        verifyFieldValue(
          'level1.level2B.level3A.level3AField',
          'Custom level3A value',
        );
        verifyFieldValue('level1.level2B.level3B.level3BField', '');
        verifyFieldValue(
          'level1.level2B.level3B.level3BFieldOverride',
          'default-level3B-override',
        );
      });
    });
  });

  describe('Form Visibility Edge Cases', () => {
    describe('multiple hide/show cycles', () => {
      beforeEach(() => {
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
            hide: 'hideControl === "hide"',
            hideStrategy: 'keep',
            valueStrategy: 'last',
          },
          {
            id: 'defaultField',
            type: 'test-text-control',
            label: 'Field with default strategy',
            defaultValue: 'default-default',
            hide: 'hideControl === "hide"',
            hideStrategy: 'keep',
            valueStrategy: 'default',
          },
          {
            id: 'resetField',
            type: 'test-text-control',
            label: 'Field with reset strategy',
            defaultValue: 'default-reset',
            hide: 'hideControl === "hide"',
            hideStrategy: 'keep',
            valueStrategy: 'reset',
          },
        ]);
      });

      it('should maintain correct values through multiple hide/show cycles', () => {
        // First cycle - set initial values
        fillInput('lastField', 'custom-last-1');
        fillInput('defaultField', 'custom-default-1');
        fillInput('resetField', 'custom-reset-1');

        // First hide
        hideControls();
        submitForm();

        // Verify values during first hide
        verifyFieldValue('lastField', 'custom-last-1');
        verifyFieldValue('defaultField', 'default-default');
        verifyFieldValue('resetField', '');

        // First show
        showControls();

        // Set new values for second cycle
        fillInput('lastField', 'custom-last-2');
        fillInput('defaultField', 'custom-default-2');
        fillInput('resetField', 'custom-reset-2');

        // Second hide
        hideControls();
        submitForm();

        // Verify values during second hide
        verifyFieldValue('lastField', 'custom-last-2');
        verifyFieldValue('defaultField', 'default-default');
        verifyFieldValue('resetField', '');

        // Second show
        showControls();
        submitForm();

        // Verify values after second show
        verifyFieldValue('lastField', 'custom-last-2');
        verifyFieldValue('defaultField', 'default-default');
        verifyFieldValue('resetField', '');
      });
    });

    describe('empty or undefined default values', () => {
      beforeEach(() => {
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
            hide: 'hideControl === "hide"',
            hideStrategy: 'keep',
            valueStrategy: 'default',
          },
          {
            id: 'emptyDefaultField',
            type: 'test-text-control',
            label: 'Field with empty default value',
            defaultValue: '',
            hide: 'hideControl === "hide"',
            hideStrategy: 'keep',
            valueStrategy: 'default',
          },
        ]);
      });

      it('should handle empty or undefined default values correctly', () => {
        // Set custom values
        fillInput('noDefaultField', 'custom-no-default');
        fillInput('emptyDefaultField', 'custom-empty-default');

        // Hide fields
        hideControls();
        submitForm();

        // Verify fields revert to empty string when default is empty or undefined
        verifyFieldValue('noDefaultField', '');
        verifyFieldValue('emptyDefaultField', '');

        // Show fields again
        showControls();
        submitForm();

        // Verify fields remain empty
        verifyFieldValue('noDefaultField', '');
        verifyFieldValue('emptyDefaultField', '');
      });
    });
  });
});

/**
 * Helper to verify field value
 */
export function verifyFieldValue(fieldId: string, expectedValue: string) {
  cy.getByTestId(`${fieldId}-value`).should('have.text', expectedValue);
}

/**
 * Helper to verify field doesn't exist
 */
export function verifyFieldNotExist(fieldId: string) {
  cy.getByTestId(`${fieldId}-value`).should('not.exist');
}

/**
 * Helper to fill an input field with a specific value
 */
export function fillInput(testId: string, value: string) {
  cy.getByTestId(`${testId}-input`).clear().type(value);
}

/**
 * Helper to hide all controls
 */
export function hideControls() {
  fillInput('hideControl', 'hide');
}

/**
 * Helper to show all controls
 */
export function showControls() {
  cy.getByTestId('hideControl-input').clear();
}

/**
 * Helper to submit the form
 */
export function submitForm() {
  cy.getByTestId('submit').click();
}
