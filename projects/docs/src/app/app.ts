import {
  NgDocNavbarComponent,
  NgDocRootComponent,
  NgDocSidebarComponent,
} from '@ng-doc/app';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    NgDocRootComponent,
    NgDocNavbarComponent,
    NgDocSidebarComponent,
  ],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly title = signal('docs');
}
