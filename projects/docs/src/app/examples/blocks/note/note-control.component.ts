import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgxfbBlockDirective } from '@ngx-formbar/reactive-forms';
import { NoteControl } from './note-control.type';
import { ngxfbBlockHostDirective, viewProviders } from '../../helper';

@Component({
  selector: 'docs-note-control',
  imports: [],
  templateUrl: './note-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: viewProviders,
  host: {
    '[style.--color]': 'color()',
    '[style.--background]': 'background()',
  },
  hostDirectives: [ngxfbBlockHostDirective],
})
export class NoteControlComponent {
  private readonly block = inject(NgxfbBlockDirective<NoteControl>);

  protected readonly content = this.block.content;
  protected readonly message = computed(() => this.content().message);
  protected readonly severity = computed(() => this.content().severity ?? 'info');

  protected readonly color = computed(() => {
    switch (this.severity()) {
      case 'info':
        return 'hsl(221,83%,53%)';
      case 'warn':
        return 'hsl(32,95%,44%)';
      case 'danger':
        return 'hsl(0,72%,51%)';
    }
  });

  protected readonly background = computed(() => {
    switch (this.severity()) {
      case 'info':
        return 'hsl(221,83%,73%)';
      case 'warn':
        return 'hsl(32,95%,64%)';
      case 'danger':
        return 'hsl(0,72%,71%)';
    }
  });
}
