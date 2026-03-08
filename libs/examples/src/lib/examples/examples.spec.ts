import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxFormbarExamples } from './examples';

describe('NgxFormbarExamples', () => {
  let component: NgxFormbarExamples;
  let fixture: ComponentFixture<NgxFormbarExamples>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxFormbarExamples],
    }).compileComponents();

    fixture = TestBed.createComponent(NgxFormbarExamples);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
