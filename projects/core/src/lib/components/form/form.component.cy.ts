import { NgxFwFormComponent } from './ngx-fw-form.component';
import { Type } from '@angular/core';
import { dummyControlContainer } from '../../../test/integration/shared/control-container';
import { NgxFwComponentRegistrations } from '../../tokens/component-registrations';
import { NgxFwComponentResolver } from '../../tokens/component-resolver';
import { ComponentRegistrationService } from '../../services/component-registration.service';

describe('Form Component', () => {
  it('it should create the component', () => {
    cy.mount(NgxFwFormComponent, {
      providers: [
        {
          provide: NgxFwComponentRegistrations,
          useValue: new Map<string, Type<unknown>>(),
        },
        {
          provide: NgxFwComponentResolver,
          useClass: ComponentRegistrationService,
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
