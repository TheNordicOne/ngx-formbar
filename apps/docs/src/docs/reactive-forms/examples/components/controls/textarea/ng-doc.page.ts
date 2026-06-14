import { NgDocPage } from '@ng-doc/core';
import ReactiveFormsControlsCategory from '../ng-doc.category';
import { TextareaExampleComponent } from './textarea-example.component';

const TextareaPage: NgDocPage = {
  title: 'Textarea',
  mdFile: './index.md',
  category: ReactiveFormsControlsCategory,
  order: 6,
  demos: { TextareaExampleComponent },
};

export default TextareaPage;
