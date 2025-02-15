import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxFwFormComponent } from './ngx-fw-form.component';
import { ContentRegistrationService } from '../../services/content-registration.service';
import { Type } from '@angular/core';

describe('FormComponent', () => {
  let component: NgxFwFormComponent;
  let fixture: ComponentFixture<NgxFwFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxFwFormComponent],
      providers: [
        {
          provide: ContentRegistrationService,
          useValue: new ContentRegistrationService(
            new Map<string, Type<unknown>>(),
          ),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NgxFwFormComponent);
    fixture.componentRef.setInput('formContent', []);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
