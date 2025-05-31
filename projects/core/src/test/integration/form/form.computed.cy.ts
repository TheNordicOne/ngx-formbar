import { setupForm } from '../../helper/test';

describe('Form computedValue expressions (full coverage)', () => {
  it('sets a static computed string value', () => {
    setupForm({
      content: [
        {
          id: 'staticText',
          type: 'test-text-control',
          label: 'Static Text',
          computedValue: '"Hello, World!"',
        },
      ],
    });

    cy.getByTestId('staticText-input').should('have.value', 'Hello, World!');
  });

  it('computes dynamic string based on other fields', () => {
    setupForm({
      content: [
        {
          id: 'firstName',
          type: 'test-text-control',
          label: 'First',
          defaultValue: 'Jane',
        },
        {
          id: 'lastName',
          type: 'test-text-control',
          label: 'Last',
          defaultValue: 'Doe',
        },
        {
          id: 'fullName',
          type: 'test-text-control',
          label: 'Full Name',
          computedValue: 'firstName + " " + lastName',
        },
      ],
    });

    cy.getByTestId('fullName-input').should('have.value', 'Jane Doe');

    cy.getByTestId('firstName-input').clear().type('John');
    cy.getByTestId('fullName-input').should('have.value', 'John Doe');

    cy.getByTestId('lastName-input').clear().type('Smith');
    cy.getByTestId('fullName-input').should('have.value', 'John Smith');
  });

  it('handles numeric computations', () => {
    setupForm({
      content: [
        {
          id: 'base',
          type: 'test-text-control',
          label: 'Base',
          defaultValue: '5',
        },
        {
          id: 'square',
          type: 'test-text-control',
          label: 'Square',
          computedValue: '+base * +base',
        },
      ],
    });

    cy.getByTestId('square-input').should('have.value', '25');

    cy.getByTestId('base-input').clear().type('7');
    cy.getByTestId('square-input').should('have.value', '49');
  });

  it('falls back on defaults when dependencies are empty or undefined', () => {
    setupForm({
      content: [
        {
          id: 'maybeEmpty',
          type: 'test-text-control',
          label: 'Maybe',
          defaultValue: '',
        },
        {
          id: 'fallback',
          type: 'test-text-control',
          label: 'Fallback',
          computedValue: 'maybeEmpty || "DEFAULT"',
        },
      ],
    });

    cy.getByTestId('fallback-input').should('have.value', 'DEFAULT');

    cy.getByTestId('maybeEmpty-input').type('Foo');
    cy.getByTestId('fallback-input').should('have.value', 'Foo');
  });

  it('allows built-in function calls in expressions', () => {
    setupForm({
      content: [
        {
          id: 'raw',
          type: 'test-text-control',
          label: 'Raw',
          defaultValue: 'mixedCase',
        },
        {
          id: 'upper',
          type: 'test-text-control',
          label: 'Uppercase',
          computedValue: 'raw.toUpperCase()',
        },
      ],
    });

    cy.getByTestId('upper-input').should('have.value', 'MIXEDCASE');
  });

  it('prioritizes computedValue over defaultValue on init', () => {
    setupForm({
      content: [
        {
          id: 'mix',
          type: 'test-text-control',
          label: 'Mix',
          defaultValue: 'INIT',
          computedValue: '"SHUTDOWN"',
        },
      ],
    });

    // Even though defaultValue is 'INIT', computedValue = "" wins
    cy.getByTestId('mix-input').should('have.value', 'SHUTDOWN');
  });

  it('resets manual edits when dependencies change', () => {
    setupForm({
      content: [
        {
          id: 'part1',
          type: 'test-text-control',
          label: 'Part 1',
          defaultValue: 'A',
        },
        {
          id: 'part2',
          type: 'test-text-control',
          label: 'Part 2',
          defaultValue: 'B',
        },
        {
          id: 'combo',
          type: 'test-text-control',
          label: 'Combo',
          computedValue: 'part1 + part2',
        },
      ],
    });

    // Manual override
    cy.getByTestId('combo-input').clear().type('CUSTOM');
    cy.getByTestId('combo-input').blur();
    cy.getByTestId('combo-input').should('have.value', 'CUSTOM');

    // Change a dependency → revert to computed
    cy.getByTestId('part1-input').type('X');
    cy.getByTestId('combo-input').should('have.value', 'AXB');
  });

  it('allows user to overwrite computed value and retains it until a dependency changes', () => {
    setupForm({
      content: [
        {
          id: 'part1',
          type: 'test-text-control',
          label: 'Part 1',
          defaultValue: 'A',
        },
        {
          id: 'part2',
          type: 'test-text-control',
          label: 'Part 2',
          defaultValue: 'B',
        },
        {
          id: 'combo',
          type: 'test-text-control',
          label: 'Combo',
          computedValue: 'part1 + part2',
        },

        {
          id: 'unrelated',
          type: 'test-text-control',
          label: 'Unrelated',
        },
      ],
    });

    // Initial computed: "AB"
    cy.getByTestId('combo-input').should('have.value', 'AB');

    // User overwrites the computed value
    cy.getByTestId('combo-input').clear().type('ManualEntry');
    cy.getByTestId('combo-input').blur();

    cy.getByTestId('combo-input').should('have.value', 'ManualEntry');

    // Without changing dependencies, the manual value persists
    cy.getByTestId('unrelated-input').clear().type('Not relevant');
    cy.getByTestId('combo-input').should('have.value', 'ManualEntry');

    // Once a dependency changes, the computed value is reapplied
    cy.getByTestId('part1-input').clear().type('X');
    cy.getByTestId('combo-input').should('have.value', 'XB');
  });

  it('allows user to overwrite computed value and retains it until a dependency changes', () => {
    setupForm({
      content: [
        {
          id: 'part1',
          type: 'test-text-control',
          label: 'Part 1',
          defaultValue: 'A',
        },
        {
          id: 'part2',
          type: 'test-text-control',
          label: 'Part 2',
          defaultValue: 'B',
        },
        {
          id: 'combo',
          type: 'test-text-control',
          label: 'Combo',
          computedValue: 'part1 + part2',
        },
      ],
    });

    // Initial computed: "AB"
    cy.getByTestId('combo-input').should('have.value', 'AB');

    // User overwrites the computed value
    cy.getByTestId('combo-input').clear().type('ManualEntry');
    cy.getByTestId('combo-input').blur();

    // Without changing dependencies, the manual value persists
    cy.getByTestId('combo-input').should('have.value', 'ManualEntry');

    // Once a dependency changes, the computed value is reapplied
    cy.getByTestId('part1-input').clear().type('X');
    cy.getByTestId('combo-input').should('have.value', 'XB');
  });

  // Value strategy tests for computed controls
  it('should preserve computed value when hidden and shown again [keep & last]', () => {
    setupForm({
      content: [
        { id: 'toggle', type: 'test-text-control', label: 'Toggle' },
        {
          id: 'dep',
          type: 'test-text-control',
          label: 'Dep',
          defaultValue: 'D',
        },
        {
          id: 'compLast',
          type: 'test-text-control',
          label: 'Comp Last',
          computedValue: 'dep + "Z"',
          hidden: 'toggle === "hide"',
          hideStrategy: 'keep',
          valueStrategy: 'last',
        },
      ],
    });

    cy.getByTestId('compLast-input').should('have.value', 'DZ');
    cy.getByTestId('dep-input').clear().type('X');
    cy.getByTestId('compLast-input').should('have.value', 'XZ');
    cy.getByTestId('toggle-input').clear().type('hide');
    cy.getByTestId('compLast-input').should('not.exist');
    cy.getByTestId('toggle-input').clear();
    cy.getByTestId('compLast-input').should('have.value', 'XZ');
  });

  it('should reset to default value when hidden and shown again [keep & default]', () => {
    setupForm({
      content: [
        { id: 'toggle', type: 'test-text-control', label: 'Toggle' },
        {
          id: 'dep',
          type: 'test-text-control',
          label: 'Dep',
          defaultValue: 'D',
        },
        {
          id: 'compDefault',
          type: 'test-text-control',
          label: 'Comp Default',
          defaultValue: 'DEFAULT',
          computedValue: 'dep + "Z"',
          hidden: 'toggle === "hide"',
          hideStrategy: 'keep',
          valueStrategy: 'default',
        },
      ],
    });

    cy.getByTestId('compDefault-input').should('have.value', 'DZ');
    cy.getByTestId('dep-input').clear().type('X');
    cy.getByTestId('compDefault-input').should('have.value', 'XZ');
    cy.getByTestId('toggle-input').clear().type('hide');
    cy.getByTestId('compDefault-input').should('not.exist');
    cy.getByTestId('toggle-input').clear();
    cy.getByTestId('compDefault-input').should('have.value', 'DEFAULT');
  });

  it('should clear value when hidden and shown again [keep & reset]', () => {
    setupForm({
      content: [
        { id: 'toggle', type: 'test-text-control', label: 'Toggle' },
        {
          id: 'dep',
          type: 'test-text-control',
          label: 'Dep',
          defaultValue: 'D',
        },
        {
          id: 'compReset',
          type: 'test-text-control',
          label: 'Comp Reset',
          computedValue: 'dep + "Z"',
          hidden: 'toggle === "hide"',
          hideStrategy: 'keep',
          valueStrategy: 'reset',
        },
      ],
    });

    cy.getByTestId('compReset-input').should('have.value', 'DZ');
    cy.getByTestId('dep-input').clear().type('X');
    cy.getByTestId('compReset-input').should('have.value', 'XZ');
    cy.getByTestId('toggle-input').clear().type('hide');
    cy.getByTestId('compReset-input').should('not.exist');
    cy.getByTestId('toggle-input').clear();
    cy.getByTestId('compReset-input').should('have.value', '');
  });

  describe.only('Cascading Computed Values', () => {
    it('should correctly update through 5 levels of cascading dependencies', () => {
      setupForm({
        content: [
          {
            id: 'level0',
            type: 'test-text-control',
            label: 'Level 0 Input',
            defaultValue: 'Start',
          },
          {
            id: 'level1',
            type: 'test-text-control',
            label: 'Level 1 Computed',
            computedValue: 'level0 + "-L1"',
          },
          {
            id: 'level2',
            type: 'test-text-control',
            label: 'Level 2 Computed',
            computedValue: 'level1 + "-L2"',
          },
          {
            id: 'level3',
            type: 'test-text-control',
            label: 'Level 3 Computed',
            computedValue: 'level2 + "-L3"',
          },
          {
            id: 'level4',
            type: 'test-text-control',
            label: 'Level 4 Computed',
            computedValue: 'level3 + "-L4"',
          },
          {
            id: 'level5',
            type: 'test-text-control',
            label: 'Level 5 Computed',
            computedValue: 'level4 + "-L5"',
          },
        ],
      });

      // Verify initial values
      cy.getByTestId('level0-input').should('have.value', 'Start');
      cy.getByTestId('level1-input').should('have.value', 'Start-L1');
      cy.getByTestId('level2-input').should('have.value', 'Start-L1-L2');
      cy.getByTestId('level3-input').should('have.value', 'Start-L1-L2-L3');
      cy.getByTestId('level4-input').should('have.value', 'Start-L1-L2-L3-L4');
      cy.getByTestId('level5-input').should(
        'have.value',
        'Start-L1-L2-L3-L4-L5',
      );

      // Update the base value
      cy.getByTestId('level0-input').clear().type('Updated');

      // Verify all dependent values are updated
      cy.getByTestId('level1-input').should('have.value', 'Updated-L1');
      cy.getByTestId('level2-input').should('have.value', 'Updated-L1-L2');
      cy.getByTestId('level3-input').should('have.value', 'Updated-L1-L2-L3');
      cy.getByTestId('level4-input').should(
        'have.value',
        'Updated-L1-L2-L3-L4',
      );
      cy.getByTestId('level5-input').should(
        'have.value',
        'Updated-L1-L2-L3-L4-L5',
      );
    });

    it('should handle manual override and then revert on dependency change in a 5-level cascade', () => {
      setupForm({
        content: [
          {
            id: 'level0_override',
            type: 'test-text-control',
            label: 'Level 0 Input Override',
            defaultValue: 'Initial',
          },
          {
            id: 'level1_override',
            type: 'test-text-control',
            label: 'Level 1 Computed Override',
            computedValue: 'level0_override + "-L1"',
          },
          {
            id: 'level2_override',
            type: 'test-text-control',
            label: 'Level 2 Computed Override',
            computedValue: 'level1_override + "-L2"',
          },
          {
            id: 'level3_override',
            type: 'test-text-control',
            label: 'Level 3 Computed Override',
            computedValue: 'level2_override + "-L3"',
          },
          {
            id: 'level4_override',
            type: 'test-text-control',
            label: 'Level 4 Computed Override',
            computedValue: 'level3_override + "-L4"',
          },
          {
            id: 'level5_override',
            type: 'test-text-control',
            label: 'Level 5 Computed Override',
            computedValue: 'level4_override + "-L5"',
          },
        ],
      });

      // Verify initial value of the last level
      cy.getByTestId('level5_override-input').should(
        'have.value',
        'Initial-L1-L2-L3-L4-L5',
      );

      // Manually override the last level
      cy.getByTestId('level5_override-input').clear().type('ManualOverride');
      cy.getByTestId('level5_override-input').blur(); // Ensure change is registered if updateOn is blur/submit
      cy.getByTestId('level5_override-input').should(
        'have.value',
        'ManualOverride',
      );

      // Change the base value (level0_override)
      cy.getByTestId('level0_override-input').clear().type('ChangedBase');

      // Verify the last level reverts to its computed value based on the new base
      cy.getByTestId('level5_override-input').should(
        'have.value',
        'ChangedBase-L1-L2-L3-L4-L5',
      );

      // Verify intermediate levels also updated
      cy.getByTestId('level1_override-input').should(
        'have.value',
        'ChangedBase-L1',
      );
      cy.getByTestId('level2_override-input').should(
        'have.value',
        'ChangedBase-L1-L2',
      );
      cy.getByTestId('level3_override-input').should(
        'have.value',
        'ChangedBase-L1-L2-L3',
      );
      cy.getByTestId('level4_override-input').should(
        'have.value',
        'ChangedBase-L1-L2-L3-L4',
      );
    });
  });
});
