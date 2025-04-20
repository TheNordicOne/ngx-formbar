import {
  TestTextControl,
  UnknownContent,
} from '../../test/types/controls.type';
import { dummyControlContainer } from '../../test/integration/shared/control-container';
import { formworkProviders } from '../../test/integration/shared/provide-formwork';
import { FormService } from '../services/form.service';
import { TestGroup } from '../../test/types/group.type';
import { NgxfwAbstractControlDirective } from './ngxfw-abstract-control.directive';
import { Component, input } from '@angular/core';
import { NgxFwContent } from '../types/content.type';

@Component({
  selector: 'ngxfw-host-component',
  imports: [NgxfwAbstractControlDirective],
  template: `<ng-template [ngxfwNgxfwAbstractControl]="content()" />`,
})
export class HostComponent<T extends NgxFwContent> {
  readonly content = input.required<T>();
}

describe('Content Host Component', () => {
  it('should create the component', () => {
    const content: UnknownContent = {
      id: 'some-group',
      type: 'unknown',
      label: 'Unkown',
    };

    cy.mount(HostComponent, {
      providers: [dummyControlContainer, formworkProviders(), FormService],
      componentProperties: {
        content,
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

      cy.mount(HostComponent, {
        providers: [dummyControlContainer, formworkProviders(), FormService],
        componentProperties: {
          content,
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

      cy.mount(HostComponent, {
        providers: [dummyControlContainer, formworkProviders(), FormService],
        componentProperties: {
          content,
        },
      });
      cy.getByTestId('some-control').should('exist');
    });
  });
});
