import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { loadComponent, NGX_FW_COMPONENT_RESOLVER } from '@ngx-formbar/core';
import { NgxfbFormComponent } from '@ngx-formbar/reactive-forms';
import {
  HybridComponentResolver,
  maintenanceForm,
} from '@ngx-formbar/examples';

@Component({
  selector: 'docs-custom-resolver-demo',
  imports: [NgxfbFormComponent, ReactiveFormsModule],
  templateUrl: './custom-resolver-demo.component.html',

  providers: [
    {
      provide: NGX_FW_COMPONENT_RESOLVER,
      useClass: HybridComponentResolver,
    },
    {
      provide: HybridComponentResolver,
      useExisting: NGX_FW_COMPONENT_RESOLVER,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomResolverDemoComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly componentResolver = inject(HybridComponentResolver);

  protected readonly formContent = maintenanceForm;
  protected readonly form = this.formBuilder.group({});

  protected setChoiceMode(mode: 'radio' | 'dropdown'): void {
    switch (mode) {
      case 'radio':
        this.componentResolver.updateDynamicComponent(
          'radio',
          loadComponent(() =>
            import('@ngx-formbar/examples/reactive-forms').then(
              (m) => m.RadioControlComponent,
            ),
          ),
        );
        break;
      case 'dropdown':
        this.componentResolver.updateDynamicComponent(
          'radio',
          loadComponent(() =>
            import('@ngx-formbar/examples/reactive-forms').then(
              (m) => m.DropdownControlComponent,
            ),
          ),
        );
        break;
    }
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    console.log('form.value', this.form.value);
  }

  protected reset(): void {
    this.form.reset();
  }
}
