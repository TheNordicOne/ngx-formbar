import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { FormbarBlock } from '@ngx-formbar/reactive-forms';
import { NoteControl } from '@ngx-formbar/examples';

@Component({
  selector: 'ngxfb-examples-note-control',
  imports: [],
  templateUrl: './note-control.component.html',
  styleUrl: './note-control.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--color]': 'color()',
    '[style.--background]': 'background()',
  },
})
export class NoteControlComponent implements FormbarBlock<NoteControl> {
  readonly hidden = input(false);
  readonly testId = input('');
  readonly message = input.required<string>();
  readonly severity = input<'info' | 'warn' | 'danger'>();

  protected readonly color = computed(() => {
    switch (this.severity() ?? 'info') {
      case 'info':
        return 'hsl(221,83%,53%)';
      case 'warn':
        return 'hsl(32,95%,44%)';
      case 'danger':
        return 'hsl(0,72%,51%)';
    }
  });

  protected readonly background = computed(() => {
    switch (this.severity() ?? 'info') {
      case 'info':
        return 'hsl(221,83%,73%)';
      case 'warn':
        return 'hsl(32,95%,64%)';
      case 'danger':
        return 'hsl(0,72%,71%)';
    }
  });
}
