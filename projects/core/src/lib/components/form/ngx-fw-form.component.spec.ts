import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxFwFormComponent } from './ngx-fw-form.component';

describe('FormComponent', () => {
  let component: NgxFwFormComponent;
  let fixture: ComponentFixture<NgxFwFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxFwFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NgxFwFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
