import { TestBed } from '@angular/core/testing';

import { ValidatorRegistrationService } from './validator-registration.service';
import { AsyncValidatorFn, ValidatorFn } from '@angular/forms';
import {
  NgxFwAsyncValidatorRegistrations,
  NgxFwValidatorRegistrations,
} from '../tokens/validator-registrations';
import { NgxFwValidatorResolver } from '../tokens/validator-resolver';
import { ValidatorResolver } from '../types/validator-resolver.type';

describe('ValidatorRegistrationService', () => {
  let service: ValidatorResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: NgxFwValidatorRegistrations,
          useValue: new Map<string, ValidatorFn[]>(),
        },
        {
          provide: NgxFwAsyncValidatorRegistrations,
          useValue: new Map<string, AsyncValidatorFn[]>(),
        },
        {
          provide: NgxFwValidatorResolver,
          useClass: ValidatorRegistrationService,
        },
      ],
    });
    service = TestBed.inject(NgxFwValidatorResolver);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
