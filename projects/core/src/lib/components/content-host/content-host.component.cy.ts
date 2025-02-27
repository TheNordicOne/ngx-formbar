import { ContentHostComponent } from './content-host.component';
import {
  TestTextControl,
  UnknownContent,
} from '../../../test/types/controls.type';
import { TestGroup } from '../../../test/types/group.type';
import { registrations } from '../../../test/helper/registrations';
import { dummyControlContainer } from '../../../test/integration/shared/control-container';
import { formworkProviders } from '../../../test/integration/shared/provide-formwork';

describe('Content Host Component', () => {
  it('should create the component', () => {
    const content: UnknownContent = {
      id: 'some-group',
      type: 'unknown',
      label: 'Unkown',
    };

    cy.mount(ContentHostComponent, {
      providers: [dummyControlContainer, formworkProviders],
      componentProperties: {
        content,
        registrations,
      },
    });
  });

  describe('content types', () => {
    it('uses content type group', () => {
      const content: TestGroup = {
        id: 'some-group',
        type: 'test-group',
        controls: [],
      };

      cy.mount(ContentHostComponent, {
        providers: [dummyControlContainer, formworkProviders],
        componentProperties: {
          content,
          registrations,
        },
      });
      cy.getByTestId('some-group').should('exist');
    });

    it('uses content type control', () => {
      const content: TestTextControl = {
        id: 'some-control',
        type: 'test-text-control',
        label: 'Some Control',
      };

      cy.mount(ContentHostComponent, {
        providers: [dummyControlContainer, formworkProviders],
        componentProperties: {
          content,
          registrations,
        },
      });
      cy.getByTestId('some-control').should('exist');
    });
  });
});
