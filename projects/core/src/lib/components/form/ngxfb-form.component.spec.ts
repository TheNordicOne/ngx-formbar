import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ControlContainer, FormGroupDirective } from '@angular/forms';
import { NGX_FW_COMPONENT_RESOLVER } from '../../tokens/component-resolver';
import { ComponentRegistrationService } from '../../services/component-registration.service';
import { NgxFbBaseContent } from '../../types/content.type';
import { NgxfbFormComponent } from './ngxfb-form.component';

describe('FormComponent', () => {
  let component: NgxfbFormComponent<NgxFbBaseContent>;
  let fixture: ComponentFixture<NgxfbFormComponent<NgxFbBaseContent>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxfbFormComponent],
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

    fixture = TestBed.createComponent(NgxfbFormComponent);
    fixture.componentRef.setInput('formConfig', { content: {} });
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
