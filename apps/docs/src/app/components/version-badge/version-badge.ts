import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  selector: 'docs-version-badge',
  imports: [],
  template: `<span class="version-badge">{{ version() }}</span>`,
  styleUrl: './version-badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VersionBadge {
  protected readonly version = signal(NGXFB_VERSION);
}
