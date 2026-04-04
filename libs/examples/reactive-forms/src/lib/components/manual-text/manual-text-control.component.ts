import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxfbControlDirective } from '@ngx-formbar/reactive-forms';
import { TextControl } from '@ngx-formbar/examples';
import { ngxfbControlHostDirective, viewProviders } from '../../helpers';

/**
 * A text control that handles its own visibility.
 *
 * Registered with `visibilityHandling: 'manual'` — the library does not
 * manage hiding, form model removal, or value strategy for this component.
 * The component reads `isHidden` and decides what to render.
 */
@Component({
  selector: 'ngxfb-examples-manual-text-control',
  imports: [ReactiveFormsModule],
  templateUrl: './manual-text-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: viewProviders,
  hostDirectives: [ngxfbControlHostDirective],
})
export class ManualTextControlComponent {
  private readonly control = inject(NgxfbControlDirective<TextControl>);

  protected readonly content = this.control.content;
  protected readonly name = this.control.name;
  protected readonly isHidden = this.control.isHidden;
  protected readonly testId = this.control.testId;
  protected readonly label = computed(() => this.content().label);

  protected get formControl() {
    return this.control.formControl;
  }
}
