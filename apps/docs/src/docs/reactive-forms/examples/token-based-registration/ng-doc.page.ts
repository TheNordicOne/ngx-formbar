import { NgDocPage } from '@ng-doc/core';
import ReactiveFormsExamplesCategory from '../ng-doc.category';
import { TokenBasedDemoComponent } from './token-based-demo.component';

const TokenBasedRegistrationPage: NgDocPage = {
  title: 'Token-Based Registration',
  mdFile: './index.md',
  category: ReactiveFormsExamplesCategory,
  order: 2,
  demos: { TokenBasedDemoComponent },
};

export default TokenBasedRegistrationPage;
