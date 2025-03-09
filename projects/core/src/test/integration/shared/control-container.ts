import {
  ControlContainer,
  FormGroup,
  FormGroupDirective,
} from '@angular/forms';

export const dummyControlContainer = {
  provide: ControlContainer,
  useFactory: () => {
    const directive = new FormGroupDirective([], []);
    directive.form = new FormGroup({});
    return directive;
  },
};
