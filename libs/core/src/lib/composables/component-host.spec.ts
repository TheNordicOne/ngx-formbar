import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ComponentHost, withComponentHost } from './component-host';

const destroyed = vi.fn();

@Component({
  selector: 'ngxfb-child',
  template: 'mounted',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Child implements OnDestroy {
  ngOnDestroy() {
    destroyed();
  }
}

@Directive({ selector: '[ngxfbHost]' })
class HostDirective {
  readonly host: ComponentHost = withComponentHost({
    signalMap: new Map(),
    controlConfig: signal({}),
  });
}

@Component({
  selector: 'ngxfb-parent',
  imports: [HostDirective],
  template: '<div ngxfbHost></div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Parent {
  readonly directive = viewChild.required(HostDirective);
}

describe('withComponentHost', () => {
  it('destroys the mounted component with the host', () => {
    destroyed.mockClear();
    const fixture = TestBed.createComponent(Parent);
    fixture.detectChanges();

    fixture.componentInstance.directive().host.mount(Child);
    fixture.detectChanges();
    fixture.destroy();

    expect(destroyed).toHaveBeenCalledOnce();
  });

  it('removes the mounted component on clear', () => {
    destroyed.mockClear();
    const fixture = TestBed.createComponent(Parent);
    fixture.detectChanges();
    const { host } = fixture.componentInstance.directive();

    host.mount(Child);
    host.clear();

    expect(destroyed).toHaveBeenCalledOnce();
    fixture.destroy();
    expect(destroyed).toHaveBeenCalledOnce();
  });
});
