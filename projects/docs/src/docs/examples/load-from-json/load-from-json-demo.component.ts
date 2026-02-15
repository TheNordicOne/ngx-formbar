import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgxFbForm } from '@ngx-formbar/core';
import { NgxfbFormComponent } from '@ngx-formbar/reactive-forms';
import { FormControls } from '../../../app/examples/helper/form.type';

@Component({
  selector: 'docs-load-from-json-demo',
  imports: [NgxfbFormComponent, ReactiveFormsModule],
  templateUrl: './load-from-json-demo.component.html',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadFromJsonDemoComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly httpClient = inject(HttpClient);

  protected readonly form = this.formBuilder.group({});
  protected readonly formContent = toSignal(
    this.httpClient.get<NgxFbForm<FormControls>>(
      '/examples/maintenanceForm.json',
    ),
  );

  protected onSubmit(event: Event) {
    event.preventDefault();
    console.log('form.value', this.form.value);
  }

  protected reset() {
    this.form.reset();
  }
}
