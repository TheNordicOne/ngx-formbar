import { Component, inject, input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TestGroup } from '../../../types/group.type';
import { TestGroupComponent } from '../../../components/test-group/test-group.component';
import { FormService } from '../../../../lib/services/form.service';

@Component({
  selector: 'ngxfw-group-integration-host',
  imports: [ReactiveFormsModule, TestGroupComponent],
  templateUrl: './group-integration-host.component.html',
  providers: [FormService],
})
export class GroupIntegrationHostComponent {
  private readonly formBuilder = inject(FormBuilder);
  readonly content = input.required<TestGroup>();
  readonly name = input.required<string>();

  form = this.formBuilder.group({});
}
