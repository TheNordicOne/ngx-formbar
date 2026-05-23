import { ControlContainer } from '@angular/forms';
import { inject } from '@angular/core';

export const viewProviders = [
  {
    provide: ControlContainer,
    useFactory: (): ControlContainer => inject(ControlContainer, { skipSelf: true }),
  },
];
