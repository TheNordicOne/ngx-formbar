import { NgDocApi } from '@ng-doc/core';

const api: NgDocApi = {
  title: 'API Reference',
  order: 7,
  scopes: [
    {
      name: '@ngx-formbar/core',
      route: 'core',
      include: 'libs/core/src/index.ts',
    },
    {
      name: '@ngx-formbar/reactive-forms',
      route: 'reactive-forms',
      include: 'libs/reactive-forms/src/index.ts',
    },
  ],
};

export default api;
