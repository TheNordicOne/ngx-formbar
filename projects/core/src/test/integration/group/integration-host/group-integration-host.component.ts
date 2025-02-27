import { Component, inject, input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TestGroup } from '../../../types/group.type';
import { TestGroupComponent } from '../../../components/test-group/test-group.component';

@Component({
  selector: 'ngxfw-group-integration-host',
  imports: [ReactiveFormsModule, TestGroupComponent],
  templateUrl: './group-integration-host.component.html',
})
export class GroupIntegrationHostComponent {
  private readonly formBuilder = inject(FormBuilder);
  readonly content = input.required<TestGroup>();

  form = this.formBuilder.group({});
}
