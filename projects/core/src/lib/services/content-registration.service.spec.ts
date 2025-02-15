import { TestBed } from '@angular/core/testing';

import { ContentRegistrationService } from './content-registration.service';
import { Type } from '@angular/core';

describe('ContentRegistrationService', () => {
  let service: ContentRegistrationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ContentRegistrationService,
          useValue: new ContentRegistrationService(
            new Map<string, Type<unknown>>(),
          ),
        },
      ],
    });
    service = TestBed.inject(ContentRegistrationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
