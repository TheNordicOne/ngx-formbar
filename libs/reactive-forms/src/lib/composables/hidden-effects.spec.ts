import { signal, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { hiddenEffects } from './hidden-effects';

class Mounted {
  readonly mounted = true;
}

describe('hiddenEffects', () => {
  function mountedWith(
    component: Type<unknown> | null,
    parent: FormGroup | null,
  ) {
    const mount = vi.fn();

    TestBed.runInInjectionContext(() => {
      hiddenEffects({
        component: signal(component),
        isHidden: signal(false),
        handleVisibility: signal(true),
        parentControl: () => parent,
        host: { mount, clear: vi.fn() },
        onHidden: vi.fn(),
        onVisible: vi.fn(),
      });
    });
    TestBed.tick();

    return mount;
  }

  it('mounts with a component and a parent', () => {
    expect(mountedWith(Mounted, new FormGroup({}))).toHaveBeenCalledWith(
      Mounted,
    );
  });

  it('waits for the component', () => {
    expect(mountedWith(null, new FormGroup({}))).not.toHaveBeenCalled();
  });

  it('waits for the parent', () => {
    expect(mountedWith(Mounted, null)).not.toHaveBeenCalled();
  });
});
