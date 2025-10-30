import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ControlContainer, FormGroupDirective } from '@angular/forms';
import { NGX_FW_COMPONENT_RESOLVER } from '../../tokens/component-resolver';
import { ComponentRegistrationService } from '../../services/component-registration.service';
import { NgxFbBaseContent } from '../../types/content.type';
import { NgxFbFormComponent } from './ngx-fw-form.component';

describe('FormComponent', () => {
  let component: NgxFbFormComponent<NgxFbBaseContent>;
  let fixture: ComponentFixture<NgxFbFormComponent<NgxFbBaseContent>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxFbFormComponent],
      providers: [
        {
          provide: NGX_FW_COMPONENT_RESOLVER,
          useClass: ComponentRegistrationService,
        },
        {
          provide: ControlContainer,
          useValue: new FormGroupDirective([], []),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NgxFbFormComponent);
    fixture.componentRef.setInput('formConfig', { content: {} });
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
