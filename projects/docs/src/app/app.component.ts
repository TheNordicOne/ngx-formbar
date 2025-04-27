import {
  NgDocNavbarComponent,
  NgDocRootComponent,
  NgDocSidebarComponent,
} from '@ng-doc/app';
import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import {
  NgDocButtonIconComponent,
  NgDocIconComponent,
  NgDocTooltipDirective,
} from '@ng-doc/ui-kit';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    NgDocRootComponent,
    NgDocNavbarComponent,
    NgDocSidebarComponent,
    NgDocButtonIconComponent,
    NgDocTooltipDirective,
    NgDocIconComponent,
    RouterLink,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'docs';
}
