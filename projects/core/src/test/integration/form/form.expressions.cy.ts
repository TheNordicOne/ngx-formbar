import { setupForm } from '../../helper/test';
import { FormContext } from '../../../lib/types/expression.type';

describe('Form Expressions', () => {
  describe('Deep Hierarchy Visibility Conditions', () => {
    it('should control visibility of a deeply nested field based on a root level field [deep hierarchy]', () => {
      setupForm({
        content: {
          toggleControl: {
            type: 'test-text-control',
            label: 'Type "hide" to hide nested fields',
          },
          rootField: {
            type: 'test-text-control',
            label: 'Root level field',
            defaultValue: 'root value',
          },
          level1: {
            type: 'test-group',
            title: 'Level 1',
            controls: {
              level1Field: {
                type: 'test-text-control',
                label: 'Level 1 Field',
                defaultValue: 'level 1 value',
              },
              level2A: {
                type: 'test-group',
                title: 'Level 2A',
                controls: {
                  level2AField: {
                    type: 'test-text-control',
                    label: 'Level 2A Field',
                    hidden: 'toggleControl === "hide"',
                    hideStrategy: 'remove',
                    defaultValue: 'level 2A value',
                  },
                },
              },
              level2B: {
                type: 'test-group',
                title: 'Level 2B',
                controls: {
                  level2BField: {
                    type: 'test-text-control',
                    label: 'Level 2B Field',
                    defaultValue: 'level 2B value',
                  },
                  level3A: {
                    type: 'test-group',
                    title: 'Level 3A',
                    controls: {
                      level3AField: {
                        type: 'test-text-control',
                        label: 'Level 3A Field',
                        hidden: 'toggleControl === "hide"',
                        hideStrategy: 'keep',
                        defaultValue: 'level 3A value',
                      },
                    },
                  },
                  level3B: {
                    type: 'test-group',
                    title: 'Level 3B',
                    hidden: 'toggleControl === "hide"',
                    controls: {
                      level3BField: {
                        type: 'test-text-control',
                        label: 'Level 3B Field',
                        defaultValue: 'level 3B value',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Initially all fields should be visible
      cy.getByTestId('level2AField-input').should('be.visible');
      cy.getByTestId('level3AField-input').should('be.visible');
      cy.getByTestId('level3BField-input').should('be.visible');

      // Hide fields with the toggle control
      cy.getByTestId('toggleControl-input').clear().type('hide');

      // Check that fields with hidden condition are not visible
      cy.getByTestId('level2AField-input').should('not.exist');
      cy.getByTestId('level3AField-input').should('not.exist');
      cy.getByTestId('level1.level2B.level3B-group').should('not.exist');

      // Fields without hidden condition should still be visible
      cy.getByTestId('rootField-input').should('be.visible');
      cy.getByTestId('level1Field-input').should('be.visible');
      cy.getByTestId('level2BField-input').should('be.visible');

      // Show fields again by clearing the toggle control
      cy.getByTestId('toggleControl-input').clear();

      // All fields should be visible again
      cy.getByTestId('level2AField-input').should('be.visible');
      cy.getByTestId('level3AField-input').should('be.visible');
      cy.getByTestId('level3BField-input').should('be.visible');
    });
  });

  describe('Complex Expression Conditions', () => {
    it('should evaluate complex expressions with multiple operators [complex expressions]', () => {
      setupForm({
        content: {
          valueA: {
            type: 'test-text-control',
            label: 'Value A',
            defaultValue: '10',
          },
          valueB: {
            type: 'test-text-control',
            label: 'Value B',
            defaultValue: '20',
          },
          valueC: {
            type: 'test-text-control',
            label: 'Value C',
            defaultValue: '30',
          },
          hiddenByComplexExpression: {
            type: 'test-text-control',
            label: 'Hidden by complex expression',
            hidden: '+valueA + +valueB > +valueC',
            defaultValue: 'Should be hidden initially',
          },
          visibleByComplexExpression: {
            type: 'test-text-control',
            label: 'Visible by complex expression',
            hidden: '+valueA * +valueB < +valueC',
            defaultValue: 'Should be visible initially',
          },
        },
      });

      // Check initial state: 10 + 20 > 30 is false, so the field should be visible
      cy.getByTestId('hiddenByComplexExpression-input').should('be.visible');

      // 10 * 20 < 30 is false, so this field should be visible
      cy.getByTestId('visibleByComplexExpression-input').should('be.visible');

      // Change valueA to make the first expression true
      cy.getByTestId('valueA-input').clear().type('20');

      // Now 20 + 20 > 30 is true, so this field should be hidden
      cy.getByTestId('hiddenByComplexExpression-input').should('not.exist');

      // 20 * 20 < 30 is still false, so this field should be visible
      cy.getByTestId('visibleByComplexExpression-input').should('be.visible');

      // Change valueC to make the second expression true
      cy.getByTestId('valueC-input').clear().type('500');

      // Now 20 * 20 < 500 is true, so this field should be hidden
      cy.getByTestId('visibleByComplexExpression-input').should('not.exist');
    });

    it('should handle conditional expressions with multiple field dependencies [multiple dependencies]', () => {
      setupForm({
        content: {
          showCondition: {
            type: 'test-text-control',
            label: 'Show Condition',
            defaultValue: 'no',
          },
          secondCondition: {
            type: 'test-text-control',
            label: 'Second Condition',
            defaultValue: 'no',
          },
          conditionalField: {
            type: 'test-text-control',
            label: 'Conditional Field',
            hidden: 'showCondition !== "yes" || secondCondition !== "yes"',
            defaultValue: 'Only visible when both conditions are "yes"',
          },
        },
      });

      cy.getByTestId('conditionalField-input').should('not.exist');

      cy.getByTestId('showCondition-input').clear().type('yes');

      cy.getByTestId('conditionalField-input').should('not.exist');

      cy.getByTestId('secondCondition-input').clear().type('yes');

      cy.getByTestId('conditionalField-input').should('be.visible');

      cy.getByTestId('showCondition-input').clear().type('no');

      cy.getByTestId('conditionalField-input').should('not.exist');
    });
  });

  describe('Cross-Group Dependencies', () => {
    it('should handle visibility conditions between fields in different branches of the form [cross-branch visibility]', () => {
      setupForm({
        content: {
          branchA: {
            type: 'test-group',
            title: 'Branch A',
            controls: {
              toggleField: {
                type: 'test-text-control',
                label: 'Type "show" to reveal field in Branch B',
                defaultValue: '',
              },
            },
          },
          branchB: {
            type: 'test-group',
            title: 'Branch B',
            controls: {
              nestedGroup: {
                type: 'test-group',
                title: 'Nested Group',
                controls: {
                  dependentField: {
                    type: 'test-text-control',
                    label: 'Dependent Field',
                    hidden: 'branchA.toggleField !== "show"',
                    defaultValue: 'I depend on Branch A field',
                  },
                },
              },
            },
          },
        },
      });

      // Initially dependent field should be hidden
      cy.getByTestId('dependentField-input').should('not.exist');

      // Set the toggle field value to "show"
      cy.getByTestId('toggleField-input').clear().type('show');

      // Dependent field should now be visible
      cy.getByTestId('dependentField-input').should('be.visible');

      // Change toggle field to something else
      cy.getByTestId('toggleField-input').clear().type('hide');

      // Dependent field should be hidden again
      cy.getByTestId('dependentField-input').should('not.exist');
    });
  });

  describe('Function-based Expressions', () => {
    it('should control visibility using a function for "hidden" with default hideStrategy', () => {
      setupForm({
        content: {
          triggerFieldFunc: {
            type: 'test-text-control',
            label: 'Type "hide" to hide target',
            defaultValue: '',
          },
          targetFieldFunc: {
            type: 'test-text-control',
            label: 'Target Field (Function Hidden)',
            hidden: (formValue: FormContext) =>
              formValue['triggerFieldFunc'] === 'hide',
            defaultValue: 'I can be hidden by a function',
          },
        },
      });

      cy.getByTestId('targetFieldFunc-input').should('be.visible');

      cy.getByTestId('triggerFieldFunc-input').clear().type('hide');

      cy.getByTestId('targetFieldFunc-input').should('not.exist');

      cy.getByTestId('triggerFieldFunc-input').clear();

      cy.getByTestId('targetFieldFunc-input').should('be.visible');
    });

    it('should control visibility using a function for "hidden" with "keep" hideStrategy', () => {
      setupForm({
        content: {
          triggerFieldFuncKeep: {
            type: 'test-text-control',
            label: 'Type "hide" to hide target (keep)',
            defaultValue: '',
          },
          targetFieldFuncKeep: {
            type: 'test-text-control',
            label: 'Target Field (Function Hidden, Keep)',
            hidden: (formValue: FormContext) =>
              formValue['triggerFieldFuncKeep'] === 'hide',
            hideStrategy: 'keep',
            defaultValue: 'I can be hidden by a function (kept in DOM)',
          },
        },
      });

      cy.getByTestId('targetFieldFuncKeep-input').should('be.visible');

      cy.getByTestId('triggerFieldFuncKeep-input').clear().type('hide');

      cy.getByTestId('targetFieldFuncKeep-input').should('not.exist');

      cy.getByTestId('triggerFieldFuncKeep-input').clear();

      cy.getByTestId('targetFieldFuncKeep-input').should('be.visible');
    });

    it('should control "disabled" state using a function', () => {
      setupForm({
        content: {
          triggerDisable: {
            type: 'test-text-control',
            label: 'Type "disable" to disable target',
            defaultValue: '',
          },
          targetFieldDisabled: {
            type: 'test-text-control',
            label: 'Target Field (Function Disabled)',
            disabled: (formValue: FormContext) =>
              formValue['triggerDisable'] === 'disable',
            defaultValue: 'I can be disabled',
          },
        },
      });

      cy.getByTestId('targetFieldDisabled-input').should('not.be.disabled');
      cy.getByTestId('triggerDisable-input').clear().type('disable');
      cy.getByTestId('targetFieldDisabled-input').should('be.disabled');
      cy.getByTestId('triggerDisable-input').clear();
      cy.getByTestId('targetFieldDisabled-input').should('not.be.disabled');
    });

    it('should control "readonly" state using a function', () => {
      setupForm({
        content: {
          triggerReadonly: {
            type: 'test-text-control',
            label: 'Type "readonly" to make target readonly',
            defaultValue: '',
          },
          targetFieldReadonly: {
            type: 'test-text-control',
            label: 'Target Field (Function Readonly)',
            readonly: (formValue: FormContext) =>
              formValue['triggerReadonly'] === 'readonly',
            defaultValue: 'I can be readonly',
          },
        },
      });

      cy.getByTestId('targetFieldReadonly-input').should(
        'not.have.attr',
        'readonly',
      );
      cy.getByTestId('triggerReadonly-input').clear().type('readonly');
      cy.getByTestId('targetFieldReadonly-input').should(
        'have.attr',
        'readonly',
      );
      cy.getByTestId('triggerReadonly-input').clear();
      cy.getByTestId('targetFieldReadonly-input').should(
        'not.have.attr',
        'readonly',
      );
    });

    it('should compute value using a function for "computedValue"', () => {
      setupForm({
        content: {
          sourceFieldA: {
            type: 'test-text-control',
            label: 'Source A',
            defaultValue: 'Hello',
          },
          sourceFieldB: {
            type: 'test-text-control',
            label: 'Source B',
            defaultValue: 'World',
          },
          targetFieldComputedFunc: {
            type: 'test-text-control',
            label: 'Target Field (Function Computed)',
            computedValue: (formValue: FormContext): string =>
              `${formValue['sourceFieldA']?.toString() ?? ''} ${formValue['sourceFieldB']?.toString() ?? ''}!`.trim(),
            defaultValue: '',
          },
        },
      });

      cy.getByTestId('targetFieldComputedFunc-input').should(
        'have.value',
        'Hello World!',
      );

      cy.getByTestId('sourceFieldA-input').clear().type('Goodbye');
      cy.getByTestId('targetFieldComputedFunc-input').should(
        'have.value',
        'Goodbye World!',
      );

      cy.getByTestId('sourceFieldB-input').clear().type('Universe');
      cy.getByTestId('targetFieldComputedFunc-input').should(
        'have.value',
        'Goodbye Universe!',
      );

      cy.getByTestId('sourceFieldA-input').clear();
      cy.getByTestId('targetFieldComputedFunc-input').should(
        'have.value',
        'Universe!',
      );
    });

    it('should update label using a function for "dynamicLabel"', () => {
      setupForm({
        content: {
          nameForLabel: {
            type: 'test-text-control',
            label: 'Name',
            defaultValue: 'User',
          },
          targetFieldLabelFunc: {
            type: 'test-text-control',
            label: 'Initial Static Label',
            dynamicLabel: (formValue: FormContext): string => {
              const name =
                (formValue['nameForLabel'] as string | undefined) ?? '';
              return `Greeting for ${name.length > 0 ? name : 'Guest'}`;
            },
            defaultValue: 'Some value',
          },
        },
      });

      cy.getByTestId('targetFieldLabelFunc-label').should(
        'contain.text',
        'Greeting for User',
      );

      cy.getByTestId('nameForLabel-input').clear().type('Alice');
      cy.getByTestId('targetFieldLabelFunc-label').should(
        'contain.text',
        'Greeting for Alice',
      );

      cy.getByTestId('nameForLabel-input').clear();
      cy.getByTestId('targetFieldLabelFunc-label').should(
        'contain.text',
        'Greeting for Guest',
      );
    });

    it('should support any function', () => {
      setupForm({
        content: {
          nameForLabel: {
            type: 'test-text-control',
            label: 'Name',
            defaultValue: 'User',
          },
          targetFieldLabelFunc: {
            type: 'test-text-control',
            label: 'Initial Static Label',
            dynamicLabel: (formValue: FormContext): string => {
              const name =
                (formValue['nameForLabel'] as string | undefined) ?? '';
              return getGreeting(name);
            },
            defaultValue: 'Some value',
          },
        },
      });

      cy.getByTestId('targetFieldLabelFunc-label').should(
        'contain.text',
        'Greeting for User',
      );

      cy.getByTestId('nameForLabel-input').clear().type('Alice');
      cy.getByTestId('targetFieldLabelFunc-label').should(
        'contain.text',
        'Greeting for Alice',
      );

      cy.getByTestId('nameForLabel-input').clear();
      cy.getByTestId('targetFieldLabelFunc-label').should(
        'contain.text',
        'Greeting for Guest',
      );
    });
  });
});

function getGreeting(name: string) {
  return `Greeting for ${name.length > 0 ? name : 'Guest'}`;
}
