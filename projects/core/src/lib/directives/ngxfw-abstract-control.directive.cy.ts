import {
  TestTextControl,
  UnknownContent,
} from '../../test/types/controls.type';
import { dummyControlContainer } from '../../test/integration/shared/control-container';
import { FormService } from '../services/form.service';
import { TestGroup } from '../../test/types/group.type';
import { Component, input } from '@angular/core';
import { NgxfbAbstractControlDirective } from './ngxfw-abstract-control.directive';
import { NgxFbContent } from '../types/content.type';
import { formbarProviders } from '../../test/integration/shared/provide-formwork';

@Component({
  selector: 'ngxfb-host-component',
  imports: [NgxfbAbstractControlDirective],
  template: ` <ng-template [ngxfbAbstractControl]="[name(), content()]" />`,
})
export class HostComponent<T extends NgxFbContent> {
  readonly content = input.required<T>();
  readonly name = input.required<string>();
}

describe('Content Host Component', () => {
  it('should create the component', () => {
    const content: UnknownContent = {
      type: 'unknown',
      label: 'Unkown',
    };

    cy.mount(HostComponent, {
      providers: [dummyControlContainer, formbarProviders(), FormService],
      componentProperties: {
        name: 'some-group',
        content,
      },
    });
  });

  describe('content types', () => {
    it('uses content type group', () => {
      const content: TestGroup = {
        type: 'test-group',
        controls: {},
      };

      cy.mount(HostComponent, {
        providers: [dummyControlContainer, formbarProviders(), FormService],
        componentProperties: {
          name: 'some-group',
          content,
        },
      });
      cy.getByTestId('some-group').should('exist');
    });

    it('uses content type control', () => {
      const content: TestTextControl = {
        type: 'test-text-control',
        label: 'Some Control',
      };

      cy.mount(HostComponent, {
        providers: [dummyControlContainer, formbarProviders(), FormService],
        componentProperties: {
          name: 'some-control',
          content,
        },
      });
      cy.getByTestId('some-control').should('exist');
    });
  });
});
