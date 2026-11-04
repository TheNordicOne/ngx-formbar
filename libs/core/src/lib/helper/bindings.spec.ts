import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
  Type,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createBinding, createBindings, getInputNames } from './bindings';

@Component({
  selector: 'ngxfb-target',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Target {
  readonly first = input<unknown>();
  // eslint-disable-next-line @angular-eslint/no-input-rename
  readonly second = input<unknown>(undefined, { alias: 'aliased' });
}

function render(
  component: Type<Target>,
  bindings: ReturnType<typeof createBindings>,
) {
  const fixture = TestBed.createComponent(component, { bindings });
  fixture.detectChanges();
  return fixture.componentInstance;
}

describe('bindings', () => {
  it('names the inputs by their template name', () => {
    expect(getInputNames(Target)).toEqual(['first', 'aliased']);
  });

  it('has no inputs for a class that is no component', () => {
    expect(getInputNames(Object)).toEqual([]);
  });

  it('binds a plain config value', () => {
    expect(render(Target, [createBinding('first', { first: 1 })]).first()).toBe(
      1,
    );
  });

  it('binds the value of a signal in the config', () => {
    expect(
      render(Target, [createBinding('first', { first: signal(1) })]).first(),
    ).toBe(1);
  });

  it('prefers a mapped signal and falls back to the config', () => {
    const instance = render(
      Target,
      createBindings(
        Target,
        new Map([['first', signal('mapped')]]),
        signal({ first: 'config', aliased: 'config' }),
      ),
    );

    expect(instance.first()).toBe('mapped');
    expect(instance.second()).toBe('config');
  });
});
