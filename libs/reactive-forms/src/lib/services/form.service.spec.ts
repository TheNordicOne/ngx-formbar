import { TestBed } from '@angular/core/testing';
import { ControlContainer, FormControl, FormGroup } from '@angular/forms';
import {
  FORM_LIFECYCLE_STATE,
  formLifecycleStateFactory,
} from './form-lifecycle-state';
import { FormService } from './form.service';

describe('FormService', () => {
  it('has the form value before the first change', () => {
    const control = new FormGroup({ a: new FormControl('start') });

    TestBed.configureTestingModule({
      providers: [
        FormService,
        { provide: ControlContainer, useValue: { control } },
        {
          provide: FORM_LIFECYCLE_STATE,
          useFactory: formLifecycleStateFactory,
        },
      ],
    });

    expect(TestBed.inject(FormService).formValue()).toEqual({ a: 'start' });
  });
});
