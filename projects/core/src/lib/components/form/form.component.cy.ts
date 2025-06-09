import { NgxFwFormComponent } from './ngx-fw-form.component';
import { ComponentRegistrationService } from '../../services/component-registration.service';
import { Type } from '@angular/core';
import { dummyControlContainer } from '../../../test/integration/shared/control-container';

describe('Form Component', () => {
  it('it should create the component', () => {
    cy.mount(NgxFwFormComponent, {
      providers: [
        {
          provide: ComponentRegistrationService,
          useValue: new ComponentRegistrationService(
            new Map<string, Type<unknown>>(),
          ),
        },
        dummyControlContainer,
      ],
      componentProperties: {
        formConfig: {
          content: {},
        },
      },
    });
  });
});
