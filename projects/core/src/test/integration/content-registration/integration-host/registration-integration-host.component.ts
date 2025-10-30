import { Component, input } from '@angular/core';
import { TestTextControl } from '../../../types/controls.type';
import { FormService } from '../../../../lib/services/form.service';
import { NgxfbAbstractControlDirective } from '../../../../lib';

@Component({
  selector: 'ngxfb-integration-host',
  imports: [NgxfbAbstractControlDirective],
  templateUrl: './registration-integration-host.component.html',
  providers: [FormService],
})
export class RegistrationIntegrationHostComponent {
  readonly content = input.required<TestTextControl>();
  readonly name = input.required<string>();
}
