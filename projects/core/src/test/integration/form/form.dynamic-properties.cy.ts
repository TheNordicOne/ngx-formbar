import { setupForm } from '../../helper/test';

describe('Form Dynamic Properties', () => {
  describe('Control dynamicLabel', () => {
    it('should display dynamic label based on expression and update it', () => {
      setupForm([
        {
          id: 'source',
          type: 'test-text-control',
          label: 'Source',
          defaultValue: 'Initial',
        },
        {
          id: 'target',
          type: 'test-text-control',
          label: 'Static Target Label',
          dynamicLabel: "source + ' Dynamic Label'",
        },
      ]);

      cy.getByTestId('target-label').should(
        'have.text',
        'Initial Dynamic Label',
      );
      cy.getByTestId('source-input').clear().type('Updated');
      cy.getByTestId('target-label').should(
        'have.text',
        'Updated Dynamic Label',
      );
    });

    it('should use static label if dynamicLabel is not provided', () => {
      setupForm([
        {
          id: 'target',
          type: 'test-text-control',
          label: 'Purely Static Label',
        },
      ]);
      cy.getByTestId('target-label').should('have.text', 'Purely Static Label');
    });
  });

  describe('Group dynamicTitle', () => {
    it('should display dynamic title based on expression and update it', () => {
      setupForm([
        {
          id: 'source',
          type: 'test-text-control',
          label: 'Source',
          defaultValue: 'Initial',
        },
        {
          id: 'targetGroup',
          type: 'test-group',
          title: 'Static Group Title',
          dynamicTitle: "source + ' Dynamic Title'",
          controls: [],
        },
      ]);

      cy.getByTestId('targetGroup-title').should(
        'have.text',
        'Initial Dynamic Title',
      );
      cy.getByTestId('source-input').clear().type('Updated');
      cy.getByTestId('targetGroup-title').should(
        'have.text',
        'Updated Dynamic Title',
      );
    });

    it('should use static title if dynamicTitle is not provided', () => {
      setupForm([
        {
          id: 'targetGroup',
          type: 'test-group',
          title: 'Purely Static Title',
          controls: [],
        },
      ]);
      cy.getByTestId('targetGroup-title').should(
        'have.text',
        'Purely Static Title',
      );
    });
  });

  describe('Nested dynamic properties', () => {
    it('should handle dynamic title and label in nested structures', () => {
      setupForm([
        {
          id: 'source',
          type: 'test-text-control',
          label: 'Source',
          defaultValue: 'Test',
        },
        {
          id: 'parentGroup',
          type: 'test-group',
          title: 'Static Parent Title',
          dynamicTitle: "source === 'NullParent' ? null : 'Parent: ' + source",
          controls: [
            {
              id: 'childControl',
              type: 'test-text-control',
              label: 'Static Child Label',
              dynamicLabel:
                "source === 'NullChild' ? null : 'Child: ' + source",
            },
          ],
        },
      ]);

      // Initial state
      cy.getByTestId('parentGroup-title').should('have.text', 'Parent: Test');
      cy.getByTestId('childControl-label').should('have.text', 'Child: Test');

      // Update source, both dynamic properties update
      cy.getByTestId('source-input').clear().type('NewVal');
      cy.getByTestId('parentGroup-title').should('have.text', 'Parent: NewVal');
      cy.getByTestId('childControl-label').should('have.text', 'Child: NewVal');
    });
  });
});
