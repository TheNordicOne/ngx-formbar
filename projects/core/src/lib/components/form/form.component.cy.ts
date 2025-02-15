import { NgxFwFormComponent } from './ngx-fw-form.component';
import { ContentRegistrationService } from '../../services/content-registration.service';
import { Type } from '@angular/core';

describe('Form Component', () => {
  it('it should create the component', () => {
    cy.mount(NgxFwFormComponent, {
      providers: [
        {
          provide: ContentRegistrationService,
          useValue: new ContentRegistrationService(
            new Map<string, Type<unknown>>(),
          ),
        },
      ],
      componentProperties: {
        formContent: [],
      },
    });
  });
});
