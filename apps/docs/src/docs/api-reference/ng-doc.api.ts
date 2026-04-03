import { NgDocApi } from '@ng-doc/core';

const api: NgDocApi = {
  title: 'API Reference',
  order: 7,
  scopes: [
    {
      name: '@ngx-formbar/core',
      route: 'core',
      include: 'libs/core/src/lib/**/*.ts',
    },
    {
      name: '@ngx-formbar/reactive-forms',
      route: 'reactive-forms',
      include: 'libs/reactive-forms/src/lib/**/*.ts',
    },
  ],
};

export default api;
