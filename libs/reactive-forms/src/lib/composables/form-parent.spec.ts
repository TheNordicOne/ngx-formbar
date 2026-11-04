import { TestBed } from '@angular/core/testing';
import { ControlContainer } from '@angular/forms';
import { withFormParent } from './form-parent';

describe('withFormParent', () => {
  function pathTo(path: string[] | null) {
    TestBed.configureTestingModule({
      providers: [{ provide: ControlContainer, useValue: { path } }],
    });
    return TestBed.runInInjectionContext(() => withFormParent()).pathTo('name');
  }

  it('joins the container path with the name', () => {
    expect(pathTo(['a', 'b'])).toBe('a.b.name');
  });

  it('gives the name at the root', () => {
    expect(pathTo([])).toBe('name');
  });

  it('gives the name without a path', () => {
    expect(pathTo(null)).toBe('name');
  });
});
