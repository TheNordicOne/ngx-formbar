import { ControlContainer } from '@angular/forms';
import { inject } from '@angular/core';

export const controlContainerViewProviders = [
  {
    provide: ControlContainer,
    useFactory: () => inject(ControlContainer, { skipSelf: true }),
  },
];
