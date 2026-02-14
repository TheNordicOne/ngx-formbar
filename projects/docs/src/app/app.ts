import {
  NgDocNavbarComponent,
  NgDocRootComponent,
  NgDocSidebarComponent,
  NgDocThemeToggleComponent,
} from '@ng-doc/app';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'docs-root',
  imports: [
    RouterOutlet,
    NgDocRootComponent,
    NgDocNavbarComponent,
    NgDocSidebarComponent,
    NgDocThemeToggleComponent,
  ],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  // eslint-disable-next-line @angular-eslint/no-experimental
  private readonly npmResource = httpResource<{ version: string }>(
    () => 'https://registry.npmjs.org/@ngx-formbar/core/latest',
  );
  protected readonly latestVersion = computed(() => {
    const data = this.npmResource.value();
    return data ? `v${data.version}` : '';
  });
}
