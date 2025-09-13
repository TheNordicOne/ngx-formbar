import { TestBed } from '@angular/core/testing';
import { Type } from '@angular/core';
import { NgxFwComponentResolver } from '../tokens/component-resolver';
import { NgxFwComponentRegistrations } from '../tokens/component-registrations';
import { ComponentResolver } from '../types/component-resolver.type';
import { ComponentRegistrationService } from './component-registration.service';

describe('ContentRegistrationService', () => {
  let service: ComponentResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: NgxFwComponentRegistrations,
          useValue: new Map<string, Type<unknown>>(),
        },
        {
          provide: NgxFwComponentResolver,
          useClass: ComponentRegistrationService,
        },
      ],
    });
    service = TestBed.inject(NgxFwComponentResolver);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
