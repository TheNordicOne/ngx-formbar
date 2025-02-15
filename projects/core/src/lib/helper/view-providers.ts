import { ControlContainer } from '@angular/forms';
import { inject } from '@angular/core';

export const viewProviders = [
  {
    provide: ControlContainer,
    useFactory: () => inject(ControlContainer, { skipSelf: true }),
  },
];
