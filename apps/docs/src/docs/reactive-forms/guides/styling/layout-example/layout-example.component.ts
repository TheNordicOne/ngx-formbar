// snippet-from-file="./layout-form.ts" "Form Configuration"
// snippet-from-file="./layout-example.component.ts" "TypeScript"
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgxFbFormComponent } from '@ngx-formbar/reactive-forms';
import { NgDocCodeComponent } from '@ng-doc/app/components/code';
import { NgDocHighlighterService } from '@ng-doc/app/services';
import {
  ComponentRegistrationEntry,
  ComponentRegistrationService,
  NGX_FW_COMPONENT_REGISTRATIONS,
  NGX_FW_COMPONENT_RESOLVER,
  staticComponent,
} from '@ngx-formbar/core';
import { LayoutFieldComponent } from '../layout-field/layout-field.component';
import { layoutForm } from './layout-form';

const PRESETS = [
  {
    label: 'Stacked',
    className: 'stacked',
    declarations: `display: flex;
  flex-direction: column;
  gap: 1.25rem;`,
  },
  {
    label: 'Two columns',
    className: 'two-column',
    declarations: `display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem 1.5rem;`,
  },
  {
    label: 'Inline',
    className: 'inline',
    declarations: `display: flex;
  flex-wrap: wrap;
  gap: 1.25rem 1.5rem;`,
  },
];

@Component({
  selector: 'docs-styling-layout-example',
  imports: [NgxFbFormComponent, ReactiveFormsModule, NgDocCodeComponent],
  templateUrl: './layout-example.component.html',
  styleUrl: './layout-example.component.scss',
  providers: [
    {
      provide: NGX_FW_COMPONENT_REGISTRATIONS,
      useValue: new Map<string, ComponentRegistrationEntry>([
        ['field', staticComponent(LayoutFieldComponent)],
      ]),
    },
    {
      provide: NGX_FW_COMPONENT_RESOLVER,
      useClass: ComponentRegistrationService,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StylingLayoutExampleComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly highlighter = inject(NgDocHighlighterService);

  protected readonly presets = PRESETS.map((preset) => ({
    ...preset,
    rule: `.${preset.className} {\n  ${preset.declarations}\n}`,
  }));

  protected readonly selected = signal(this.presets[1]);

  protected readonly markup = computed(() => {
    const dom = `<!-- high-level view of the rendered DOM -->
<form [formGroup]="form">
  <ngxfb-form class="${this.selected().className}">
    <ngxfb-control-outlet>
      <app-field>Full Name</app-field>
      <app-field>Email</app-field>
      <app-field>Building</app-field>
    </ngxfb-control-outlet>
  </ngxfb-form>
</form>`;

    return this.highlighter.highlight(dom);
  });

  protected readonly css = computed(() =>
    this.highlighter.highlight(this.selected().rule),
  );

  protected readonly formContent = layoutForm;

  protected readonly form = this.formBuilder.group({});
}
