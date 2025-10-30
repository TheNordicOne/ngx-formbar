import { dummyControlContainer } from '../../../test/integration/shared/control-container';
import { NGX_FW_COMPONENT_RESOLVER } from '../../tokens/component-resolver';
import { ComponentRegistrationService } from '../../services/component-registration.service';
import { NgxFbFormComponent } from './ngx-fw-form.component';

describe('Form Component', () => {
  it('it should create the component', () => {
    cy.mount(NgxFbFormComponent, {
      providers: [
        {
          provide: NGX_FW_COMPONENT_RESOLVER,
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
