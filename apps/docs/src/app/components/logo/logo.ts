import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import favicon from '../../../../public/favicon.svg';

@Component({
  selector: 'docs-logo',
  imports: [],
  templateUrl: './logo.html',
  styleUrl: './logo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Logo {
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly size = signal(36);

  // Inlined from favicon.svg so the artwork stays single-sourced. Inlining (rather
  // than referencing) is what lets the lines pick up `currentColor`, so they follow
  // the theme toggle. The markup is a build-time constant, so trusting it is safe.
  // Drop the XML prolog/doctype the file carries for its favicon role; the HTML
  // parser would otherwise keep them as stray comment nodes.
  protected readonly svg: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(
    favicon.slice(favicon.indexOf('<svg')),
  );
}
