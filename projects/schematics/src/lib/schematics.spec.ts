import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Schematics } from './schematics';

describe('Schematics', () => {
  let component: Schematics;
  let fixture: ComponentFixture<Schematics>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Schematics]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Schematics);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
