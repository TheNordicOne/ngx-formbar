import { TestBed } from '@angular/core/testing';

import { ValidatorRegistrationService } from './validator-registration.service';
import { NGX_VALIDATOR_RESOLVER } from '../tokens/validator-resolver';
import { ValidatorResolver } from '../types/validator-resolver.type';

describe('ValidatorRegistrationService', () => {
  let service: ValidatorResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: NGX_VALIDATOR_RESOLVER,
          useClass: ValidatorRegistrationService,
        },
      ],
    });
    service = TestBed.inject(NGX_VALIDATOR_RESOLVER);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
