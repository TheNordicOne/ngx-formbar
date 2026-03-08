import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxFormbarReactiveForms } from './reactive-forms';

describe('NgxFormbarReactiveForms', () => {
  let component: NgxFormbarReactiveForms;
  let fixture: ComponentFixture<NgxFormbarReactiveForms>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxFormbarReactiveForms],
    }).compileComponents();

    fixture = TestBed.createComponent(NgxFormbarReactiveForms);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
