import { NgDocPage } from '@ng-doc/core';
import ReactiveFormsInteractiveCategory from '../interactive/ng-doc.category';
import { TokenBasedDemoComponent } from './token-based-demo.component';

const TokenBasedRegistrationPage: NgDocPage = {
  title: 'Token-Based Registration',
  mdFile: './index.md',
  category: ReactiveFormsInteractiveCategory,
  order: 2,
  demos: { TokenBasedDemoComponent },
};

export default TokenBasedRegistrationPage;
