import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxFormbarCore } from './core';

describe('NgxFormbarCore', () => {
  let component: NgxFormbarCore;
  let fixture: ComponentFixture<NgxFormbarCore>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxFormbarCore],
    }).compileComponents();

    fixture = TestBed.createComponent(NgxFormbarCore);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
