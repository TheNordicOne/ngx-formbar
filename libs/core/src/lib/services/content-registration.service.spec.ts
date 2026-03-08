import { TestBed } from '@angular/core/testing';
import { NGX_FW_COMPONENT_RESOLVER } from '../tokens/component-resolver';
import { ComponentResolver } from '../types/component-resolver.type';
import { ComponentRegistrationService } from './component-registration.service';

describe('ContentRegistrationService', () => {
  let service: ComponentResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: NGX_FW_COMPONENT_RESOLVER,
          useClass: ComponentRegistrationService,
        },
      ],
    });
    service = TestBed.inject(NGX_FW_COMPONENT_RESOLVER);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
