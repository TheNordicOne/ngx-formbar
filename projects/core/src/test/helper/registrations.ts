import { Type } from '@angular/core';
import { TestTextControlComponent } from '../components/test-text-control/test-text-control.component';
import { TestGroupComponent } from '../components/test-group/test-group.component';

export const registrations = new Map<string, Type<unknown>>([
  ['test-text-control', TestTextControlComponent],
  ['test-group', TestGroupComponent],
]);
