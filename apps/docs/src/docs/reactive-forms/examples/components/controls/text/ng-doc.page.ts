import { NgDocPage } from '@ng-doc/core';
import ReactiveFormsControlsCategory from '../ng-doc.category';
import { TextExampleComponent } from './text-example.component';

const TextPage: NgDocPage = {
  title: 'Text',
  mdFile: './index.md',
  category: ReactiveFormsControlsCategory,
  order: 1,
  demos: { TextExampleComponent },
};

export default TextPage;
