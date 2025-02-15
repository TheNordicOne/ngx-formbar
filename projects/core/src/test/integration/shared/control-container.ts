import { ControlContainer, FormGroupDirective } from '@angular/forms';

export const dummyControlContainer = {
  provide: ControlContainer,
  useValue: new FormGroupDirective([], []),
};
