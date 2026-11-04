import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  signal,
  viewChild,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NGX_FW_FORM_VALUE } from '../tokens/form-value';
import { NGX_FW_PARENT_CONTEXT } from '../tokens/parent-context';
import { withHiddenState } from './hidden-state';

@Directive({ selector: '[ngxfbProbe]' })
class ProbeDirective {
  readonly hidden = withHiddenState(signal({ id: 'probe', type: 'probe' }));
}

@Directive({
  selector: '[ngxfbParent]',
  providers: [
    {
      provide: NGX_FW_PARENT_CONTEXT,
      useFactory: () => ({ isHidden: signal(true) }),
    },
  ],
})
class HiddenParentDirective {
  readonly hidden = true;
}

@Component({
  selector: 'ngxfb-with-parent',
  imports: [ProbeDirective, HiddenParentDirective],
  template: `<div ngxfbParent><span ngxfbProbe></span></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
class WithParent {
  readonly probe = viewChild.required(ProbeDirective);
}

@Component({
  selector: 'ngxfb-without-parent',
  imports: [ProbeDirective],
  template: `<span ngxfbProbe></span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class WithoutParent {
  readonly probe = viewChild.required(ProbeDirective);
}

describe('withHiddenState', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: NGX_FW_FORM_VALUE, useValue: signal({}) }],
    });
  });

  it('is visible without a parent', () => {
    const fixture = TestBed.createComponent(WithoutParent);
    fixture.detectChanges();

    expect(fixture.componentInstance.probe().hidden()).toBe(false);
  });

  it('inherits a hidden parent', () => {
    const fixture = TestBed.createComponent(WithParent);
    fixture.detectChanges();

    expect(fixture.componentInstance.probe().hidden()).toBe(true);
  });
});
