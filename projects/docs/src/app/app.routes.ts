import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    title: 'Home',
    path: '',
    pathMatch: 'full',
    redirectTo: 'about/what-is-ngx-formwork',
  },
];
