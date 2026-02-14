import { NgDocPage } from '@ng-doc/core';
import ExamplesCategory from '../ng-doc.category';
import { ConfigBasedDemoComponent } from './config-based-demo.component';

const ConfigBasedRegistrationPage: NgDocPage = {
  title: 'Config-Based Registration',
  mdFile: './index.md',
  category: ExamplesCategory,
  order: 3,
  demos: { ConfigBasedDemoComponent },
};

export default ConfigBasedRegistrationPage;
