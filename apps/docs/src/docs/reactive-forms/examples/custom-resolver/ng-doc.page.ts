import { NgDocPage } from '@ng-doc/core';
import ReactiveFormsInteractiveCategory from '../interactive/ng-doc.category';
import { CustomResolverDemoComponent } from './custom-resolver-demo.component';

const CustomResolverPage: NgDocPage = {
  title: 'Custom Resolver',
  mdFile: './index.md',
  category: ReactiveFormsInteractiveCategory,
  order: 6,
  demos: { CustomResolverDemoComponent },
};

export default CustomResolverPage;
