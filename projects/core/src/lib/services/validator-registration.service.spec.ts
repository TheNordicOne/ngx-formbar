import { TestBed } from '@angular/core/testing';

import { ValidatorRegistrationService } from './validator-registration.service';
import { AsyncValidatorFn, ValidatorFn } from '@angular/forms';

describe('ValidatorRegistrationService', () => {
  let service: ValidatorRegistrationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ValidatorRegistrationService,
          useValue: new ValidatorRegistrationService(
            new Map<string, ValidatorFn[]>(),
            new Map<string, AsyncValidatorFn[]>(),
          ),
        },
      ],
    });
    service = TestBed.inject(ValidatorRegistrationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
