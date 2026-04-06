import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  NgxfbAbstractControlDirective,
  ReactiveFormbarGroup,
} from '@ngx-formbar/reactive-forms';
import { GroupControl } from '@ngx-formbar/examples';
import { NgxFbContent } from '@ngx-formbar/core';
import { viewProviders } from '../../helpers';

@Component({
  selector: 'ngxfb-examples-group-control',
  imports: [ReactiveFormsModule, NgxfbAbstractControlDirective],
  templateUrl: './group-control.component.html',
  styleUrl: './group-control.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: viewProviders,
})
export class GroupControlComponent
  implements ReactiveFormbarGroup<GroupControl>
{
  readonly name = input.required<string>();
  readonly disabled = input(false);
  readonly readonly = input(false);
  readonly hidden = input(false);
  readonly title = input('');
  readonly testId = input('');
  readonly controls = input.required<[string, NgxFbContent][]>();
  readonly legend = input<string>();
}
