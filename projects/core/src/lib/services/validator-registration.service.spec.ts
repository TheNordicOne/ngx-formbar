import { TestBed } from '@angular/core/testing';

import { ValidatorRegistrationService } from './validator-registration.service';

describe('ValidatorRegistrationService', () => {
  let service: ValidatorRegistrationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ValidatorRegistrationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
