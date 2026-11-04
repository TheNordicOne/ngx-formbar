import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentRegistrationEntry } from '../types/registration.type';
import { withLoadedComponent } from './loaded-component';

@Component({
  selector: 'ngxfb-target',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Target {
  readonly loaded = true;
}

describe('withLoadedComponent', () => {
  function load(entry: ComponentRegistrationEntry | null) {
    return TestBed.runInInjectionContext(() =>
      withLoadedComponent(signal(entry)),
    );
  }

  it('is empty until an entry resolves', () => {
    expect(load({ component: Target })()).toBeNull();
  });

  it('stays empty without an entry', () => {
    const component = load(null);

    TestBed.tick();

    expect(component()).toBeNull();
  });

  it('reads an eager component', () => {
    const component = load({ component: Target });

    TestBed.tick();

    expect(component()).toBe(Target);
  });

  it('awaits a lazy component', async () => {
    const component = load({ loadComponent: () => Promise.resolve(Target) });

    TestBed.tick();
    await Promise.resolve();
    await Promise.resolve();

    expect(component()).toBe(Target);
  });
});
