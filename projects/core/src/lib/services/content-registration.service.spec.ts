import { TestBed } from '@angular/core/testing';

import { ComponentRegistrationService } from './component-registration.service';
import { Type } from '@angular/core';

describe('ContentRegistrationService', () => {
  let service: ComponentRegistrationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ComponentRegistrationService,
          useValue: new ComponentRegistrationService(
            new Map<string, Type<unknown>>(),
          ),
        },
      ],
    });
    service = TestBed.inject(ComponentRegistrationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
