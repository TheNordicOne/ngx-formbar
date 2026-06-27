import { NgDocPage } from '@ng-doc/core';
import ReactiveFormsGuidesCategory from '../ng-doc.category';
import { StylingLayoutExampleComponent } from './layout-example/layout-example.component';

const StylingPage: NgDocPage = {
  title: 'Styling',
  mdFile: './index.md',
  category: ReactiveFormsGuidesCategory,
  order: 11,
  demos: { StylingLayoutExampleComponent },
};

export default StylingPage;
