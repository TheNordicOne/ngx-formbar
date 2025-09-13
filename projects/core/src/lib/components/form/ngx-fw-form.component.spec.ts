import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxFwFormComponent } from './ngx-fw-form.component';
import { Type } from '@angular/core';
import { ControlContainer, FormGroupDirective } from '@angular/forms';
import { NgxFwBaseContent } from '../../types/content.type';
import { NgxFwComponentRegistrations } from '../../tokens/component-registrations';
import { NgxFwComponentResolver } from '../../tokens/component-resolver';
import { ComponentRegistrationService } from '../../services/component-registration.service';

describe('FormComponent', () => {
  let component: NgxFwFormComponent<NgxFwBaseContent>;
  let fixture: ComponentFixture<NgxFwFormComponent<NgxFwBaseContent>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxFwFormComponent],
      providers: [
        {
          provide: NgxFwComponentRegistrations,
          useValue: new Map<string, Type<unknown>>(),
        },
        {
          provide: NgxFwComponentResolver,
          useClass: ComponentRegistrationService,
        },
        {
          provide: ControlContainer,
          useValue: new FormGroupDirective([], []),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NgxFwFormComponent);
    fixture.componentRef.setInput('formConfig', { content: {} });
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
