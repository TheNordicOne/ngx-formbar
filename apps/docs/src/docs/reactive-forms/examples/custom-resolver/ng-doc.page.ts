import { NgDocPage } from '@ng-doc/core';
import ReactiveFormsExamplesCategory from '../ng-doc.category';
import { CustomResolverDemoComponent } from './custom-resolver-demo.component';

const CustomResolverPage: NgDocPage = {
  title: 'Custom Resolver',
  mdFile: './index.md',
  category: ReactiveFormsExamplesCategory,
  order: 6,
  demos: { CustomResolverDemoComponent },
};

export default CustomResolverPage;
