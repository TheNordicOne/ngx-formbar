import { NgDocPage } from '@ng-doc/core';
import ReactiveFormsInteractiveCategory from '../interactive/ng-doc.category';
import { ConfigBasedDemoComponent } from './config-based-demo.component';

const ConfigBasedRegistrationPage: NgDocPage = {
  title: 'Config-Based Registration',
  mdFile: './index.md',
  category: ReactiveFormsInteractiveCategory,
  order: 3,
  demos: { ConfigBasedDemoComponent },
};

export default ConfigBasedRegistrationPage;
