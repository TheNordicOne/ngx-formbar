import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { KeyValuePipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxfbControlDirective } from '@ngx-formbar/reactive-forms';
import { FileControl } from './file-control.type';
import { ngxfbControlHostDirective, viewProviders } from '../../helpers';

@Component({
  selector: 'ngxfb-examples-file-control',
  imports: [ReactiveFormsModule, KeyValuePipe],
  templateUrl: './file-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: viewProviders,
  hostDirectives: [ngxfbControlHostDirective],
})
export class FileControlComponent {
  private readonly control = inject(NgxfbControlDirective<FileControl>);

  protected readonly content = this.control.content;
  protected readonly name = this.control.name;
  protected readonly isHidden = this.control.isHidden;
  protected readonly testId = this.control.testId;
  protected readonly disabled = this.control.disabled;
  protected readonly readonly = this.control.readonly;
  protected readonly dynamicLabel = this.control.dynamicLabel;
  protected readonly label = computed(() => this.dynamicLabel() ?? this.content().label);
  protected readonly multiple = computed(() => this.content().multiple);
  protected readonly accept = computed(() => this.content().accept);
  protected readonly errors = computed(() => this.control.formControl?.errors ?? {});

  protected get formControl() {
    return this.control.formControl;
  }
}
