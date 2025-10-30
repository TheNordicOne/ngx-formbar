import { Component, inject, input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TestGroup } from '../../../types/group.type';
import { FormService } from '../../../../lib/services/form.service';

@Component({
  selector: 'ngxfb-group-integration-host',
  imports: [ReactiveFormsModule],
  templateUrl: './group-integration-host.component.html',
  providers: [FormService],
})
export class GroupIntegrationHostComponent {
  private readonly formBuilder = inject(FormBuilder);
  readonly content = input.required<TestGroup>();
  readonly name = input.required<string>();

  form = this.formBuilder.group({});
}
